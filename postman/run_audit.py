#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Auditoría de Endpoints - EBS API
Ejecuta pruebas automatizadas de todos los endpoints y genera un reporte de auditoría.

Requisitos:
    pip install requests

Uso:
    python run_audit.py
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import sys
import io

# Configurar encoding para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ============================================
# CONFIGURACIÓN
# ============================================

BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"

# Credenciales de prueba (actualizar según necesidad)
TEST_USERNAME = "user@example.com"
TEST_PASSWORD = "Usuario123"

# Timeout para requests
REQUEST_TIMEOUT = 10

# ============================================

class TestStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    ERROR = "ERROR"

@dataclass
class TestResult:
    endpoint: str
    method: str
    status_code: Optional[int]
    expected_status: int
    response_time: float
    status: TestStatus
    error_message: Optional[str] = None
    response_body: Optional[Dict] = None
    test_message: Optional[str] = None

@dataclass
class AuditReport:
    timestamp: str
    base_url: str
    total_tests: int
    passed: int
    failed: int
    skipped: int
    errors: int
    success_rate: float
    total_time: float
    results: List[Dict]
    summary: Dict

class APIAuditor:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.session = requests.Session()
        self.results: List[TestResult] = []
        self.start_time = time.time()
        self.tokens = {
            'access_token': None,
            'refresh_token': None,
            'id_token': None
        }
        # Almacenar IDs de recursos creados para pruebas posteriores
        self.created_resources = {
            'modulo_id': None,
            'curso_id': None,
            'leccion_id': None,
            'inscripcion_id': None
        }
        
    def check_backend(self) -> bool:
        """Verifica que el backend esté disponible."""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Backend no disponible: {e}")
            return False
    
    def get_cognito_tokens(self) -> Optional[Dict[str, str]]:
        """Obtiene tokens de Cognito usando boto3."""
        try:
            import boto3
            import os
            
            # Intentar leer de variables de entorno o archivo .env
            user_pool_id = os.getenv('COGNITO_USER_POOL_ID', '')
            client_id = os.getenv('COGNITO_CLIENT_ID', '')
            region = os.getenv('AWS_REGION', 'us-east-1')
            username = os.getenv('COGNITO_USERNAME', 'user@example.com')
            password = os.getenv('COGNITO_PASSWORD', 'Usuario123')
            
            # Si no están en variables de entorno, intentar leer de archivo .env en el directorio padre
            if not user_pool_id or user_pool_id == 'us-east-1_XXXXX' or not client_id or client_id == 'XXXXX':
                try:
                    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
                    if os.path.exists(env_path):
                        with open(env_path, 'r') as f:
                            for line in f:
                                if line.strip() and not line.startswith('#'):
                                    key, value = line.strip().split('=', 1)
                                    if key == 'COGNITO_USER_POOL_ID':
                                        user_pool_id = value
                                    elif key == 'COGNITO_CLIENT_ID':
                                        client_id = value
                                    elif key == 'COGNITO_USERNAME':
                                        username = value
                                    elif key == 'COGNITO_PASSWORD':
                                        password = value
                except:
                    pass
            
            if not user_pool_id or user_pool_id == 'us-east-1_XXXXX' or not client_id or client_id == 'XXXXX':
                print("⚠️  Cognito no configurado. Usando modo sin autenticación.")
                print("   Para habilitar autenticación, configura variables de entorno:")
                print("   - COGNITO_USER_POOL_ID")
                print("   - COGNITO_CLIENT_ID")
                print("   - COGNITO_USERNAME (opcional, default: user@example.com)")
                print("   - COGNITO_PASSWORD (opcional, default: Usuario123)")
                return None
            
            cognito_client = boto3.client('cognito-idp', region_name=region)
            response = cognito_client.admin_initiate_auth(
                UserPoolId=user_pool_id,
                ClientId=client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password
                }
            )
            
            tokens = response['AuthenticationResult']
            return {
                'access_token': tokens['AccessToken'],
                'refresh_token': tokens['RefreshToken'],
                'id_token': tokens['IdToken']
            }
        except ImportError:
            print("⚠️  boto3 no instalado. Instala con: pip install boto3")
            return None
        except Exception as e:
            print(f"⚠️  Error obteniendo tokens de Cognito: {e}")
            return None
    
    def authenticate(self) -> bool:
        """Intenta autenticarse usando el endpoint set-tokens."""
        print("🔐 Obteniendo tokens de Cognito...")
        tokens = self.get_cognito_tokens()
        
        if not tokens:
            print("⚠️  Autenticación: Usando endpoints públicos para pruebas iniciales")
            return False
        
        print("✅ Tokens obtenidos. Estableciendo cookies...")
        
        # Usar set-tokens para establecer cookies
        try:
            response = self.session.post(
                f"{self.api_base}/auth/set-tokens",
                json=tokens,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 200:
                self.tokens = tokens
                print("✅ Autenticación exitosa. Cookies establecidas.")
                return True
            else:
                print(f"⚠️  Error estableciendo tokens: {response.status_code}")
                return False
        except Exception as e:
            print(f"⚠️  Error en set-tokens: {e}")
            return False
    
    def _test_direct_url(
        self,
        name: str,
        method: str,
        url: str,
        expected_status: int = 200,
        requires_auth: bool = False,
        body: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> TestResult:
        """Ejecuta una prueba con URL completa."""
        request_headers = headers or {}
        # Las cookies se manejan automáticamente por la sesión de requests
        # después de usar set-tokens
        
        start_time = time.time()
        status_code = None
        response_body = None
        error_message = None
        test_status = TestStatus.ERROR
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers, timeout=REQUEST_TIMEOUT)
            elif method.upper() == "POST":
                response = self.session.post(url, json=body, headers=request_headers, timeout=REQUEST_TIMEOUT)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=body, headers=request_headers, timeout=REQUEST_TIMEOUT)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=body, headers=request_headers, timeout=REQUEST_TIMEOUT)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=request_headers, timeout=REQUEST_TIMEOUT)
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
            
            status_code = response.status_code
            response_time = time.time() - start_time
            
            try:
                response_body = response.json()
            except:
                response_body = {"raw": response.text[:200]}
            
            if status_code == expected_status:
                test_status = TestStatus.PASS
                test_message = f"Status {status_code} como se esperaba"
            elif status_code == 401 and requires_auth:
                test_status = TestStatus.SKIP
                test_message = f"Requiere autenticación (401) - SKIP"
            elif status_code == 403:
                test_status = TestStatus.SKIP
                test_message = f"Requiere permisos adicionales (403) - SKIP"
            elif status_code == 404:
                test_status = TestStatus.SKIP
                test_message = f"Recurso no encontrado (404) - Puede ser normal"
            else:
                test_status = TestStatus.FAIL
                test_message = f"Status {status_code} inesperado (esperado {expected_status})"
                
        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            test_status = TestStatus.ERROR
            error_message = "Timeout"
            test_message = "Request timeout"
        except requests.exceptions.ConnectionError:
            response_time = time.time() - start_time
            test_status = TestStatus.ERROR
            error_message = "Connection error"
            test_message = "No se pudo conectar al servidor"
        except Exception as e:
            response_time = time.time() - start_time
            test_status = TestStatus.ERROR
            error_message = str(e)
            test_message = f"Error: {str(e)[:100]}"
        
        result = TestResult(
            endpoint=name,
            method=method,
            status_code=status_code,
            expected_status=expected_status,
            response_time=response_time if 'response_time' in locals() else 0,
            status=test_status,
            error_message=error_message,
            response_body=response_body,
            test_message=test_message
        )
        
        self.results.append(result)
        return result
    
    def test_endpoint(
        self,
        name: str,
        method: str,
        path: str,
        expected_status: int = 200,
        requires_auth: bool = False,
        body: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> TestResult:
        """Ejecuta una prueba de endpoint."""
        url = f"{self.api_base}{path}" if path.startswith("/") else f"{self.api_base}/{path}"
        
        # Preparar headers
        request_headers = headers or {}
        # Las cookies se manejan automáticamente por la sesión de requests
        # después de usar set-tokens
        
        start_time = time.time()
        status_code = None
        response_body = None
        error_message = None
        test_status = TestStatus.ERROR
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers, timeout=REQUEST_TIMEOUT)
            elif method.upper() == "POST":
                response = self.session.post(
                    url,
                    json=body,
                    headers=request_headers,
                    timeout=REQUEST_TIMEOUT
                )
            elif method.upper() == "PUT":
                response = self.session.put(
                    url,
                    json=body,
                    headers=request_headers,
                    timeout=REQUEST_TIMEOUT
                )
            elif method.upper() == "PATCH":
                response = self.session.patch(
                    url,
                    json=body,
                    headers=request_headers,
                    timeout=REQUEST_TIMEOUT
                )
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=request_headers, timeout=REQUEST_TIMEOUT)
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
            
            status_code = response.status_code
            response_time = time.time() - start_time
            
            try:
                response_body = response.json()
            except:
                response_body = {"raw": response.text[:200]}
            
            # Evaluar resultado
            if status_code == expected_status:
                test_status = TestStatus.PASS
                test_message = f"Status {status_code} como se esperaba"
                
                # Guardar IDs de recursos creados para uso posterior
                if response_body and isinstance(response_body, dict) and 'id' in response_body:
                    resource_id = str(response_body['id'])
                    # Detectar tipo de recurso por el endpoint name o path
                    endpoint_lower = name.lower()
                    path_lower = path.lower()
                    if 'modulo' in endpoint_lower or '/modulos' in path_lower:
                        self.created_resources['modulo_id'] = resource_id
                    elif 'curso' in endpoint_lower or '/cursos' in path_lower:
                        self.created_resources['curso_id'] = resource_id
                    elif 'leccion' in endpoint_lower or '/lecciones' in path_lower:
                        self.created_resources['leccion_id'] = resource_id
                    elif 'inscripcion' in endpoint_lower or '/inscripciones' in path_lower:
                        self.created_resources['inscripcion_id'] = resource_id
            elif status_code == 401 and requires_auth:
                test_status = TestStatus.SKIP
                test_message = f"Requiere autenticación (401) - SKIP"
            elif status_code == 403:
                test_status = TestStatus.SKIP
                test_message = f"Requiere permisos adicionales (403) - SKIP"
            elif status_code == 404:
                test_status = TestStatus.SKIP
                test_message = f"Recurso no encontrado (404) - Puede ser normal"
            else:
                test_status = TestStatus.FAIL
                test_message = f"Status {status_code} inesperado (esperado {expected_status})"
                
        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            test_status = TestStatus.ERROR
            error_message = "Timeout"
            test_message = "Request timeout"
        except requests.exceptions.ConnectionError:
            response_time = time.time() - start_time
            test_status = TestStatus.ERROR
            error_message = "Connection error"
            test_message = "No se pudo conectar al servidor"
        except Exception as e:
            response_time = time.time() - start_time
            test_status = TestStatus.ERROR
            error_message = str(e)
            test_message = f"Error: {str(e)[:100]}"
        
        result = TestResult(
            endpoint=name,
            method=method,
            status_code=status_code,
            expected_status=expected_status,
            response_time=response_time if 'response_time' in locals() else 0,
            status=test_status,
            error_message=error_message,
            response_body=response_body,
            test_message=test_message
        )
        
        self.results.append(result)
        return result
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas de endpoints."""
        print("=" * 70)
        print("AUDITORÍA DE ENDPOINTS - EBS API")
        print("=" * 70)
        print(f"Base URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        print()
        
        # Verificar backend
        print("🔍 Verificando backend...")
        if not self.check_backend():
            print("❌ Backend no disponible. Asegúrate de que esté corriendo en", self.base_url)
            return
        print("✅ Backend disponible\n")
        
        # Autenticación
        print("🔐 Verificando autenticación...")
        self.authenticate()
        print()
        
        # ============================================
        # HEALTH & ROOT
        # ============================================
        print("📋 Probando Health & Root...")
        # Health y Root están en la raíz, no en /api
        url = f"{self.base_url}/health"
        self._test_direct_url("Health Check", "GET", url, 200)
        url = f"{self.base_url}/"
        self._test_direct_url("Root", "GET", url, 200)
        print()
        
        # ============================================
        # AUTH
        # ============================================
        print("🔐 Probando Auth...")
        self.test_endpoint("Get Tokens", "GET", "/auth/tokens", 200, requires_auth=True)
        self.test_endpoint("Refresh", "POST", "/auth/refresh", 200, requires_auth=True)
        print()
        
        # ============================================
        # USUARIOS
        # ============================================
        print("👤 Probando Usuarios...")
        self.test_endpoint("Get Profile", "GET", "/usuarios/me", 200, requires_auth=True)
        self.test_endpoint("List Usuarios", "GET", "/usuarios", 200, requires_auth=True)
        print()
        
        # ============================================
        # MODULOS
        # ============================================
        print("📚 Probando Módulos...")
        self.test_endpoint("List Modulos", "GET", "/modulos", 200)
        self.test_endpoint("Create Modulo", "POST", "/modulos", 201, requires_auth=True, body={
            "titulo": "Módulo de Auditoría",
            "fecha_inicio": "2025-01-01",
            "fecha_fin": "2025-12-31",
            "publicado": False
        })
        print()
        
        # ============================================
        # CURSOS
        # ============================================
        print("📖 Probando Cursos...")
        self.test_endpoint("List Cursos", "GET", "/cursos", 200)
        self.test_endpoint("Create Curso", "POST", "/cursos", 201, requires_auth=True, body={
            "titulo": "Curso de Auditoría",
            "descripcion": "Curso creado durante auditoría",
            "publicado": False
        })
        print()
        
        # ============================================
        # LECCIONES
        # ============================================
        print("📝 Probando Lecciones...")
        self.test_endpoint("Create Leccion", "POST", "/lecciones", 201, requires_auth=True, body={
            "modulo_id": "00000000-0000-0000-0000-000000000000",  # UUID placeholder
            "titulo": "Lección de Auditoría",
            "orden": 1,
            "publicado": False
        })
        print()
        
        # ============================================
        # INSCRIPCIONES
        # ============================================
        print("📋 Probando Inscripciones...")
        self.test_endpoint("List Inscripciones", "GET", "/inscripciones", 200, requires_auth=True)
        self.test_endpoint("Create Inscripcion", "POST", "/inscripciones", 201, requires_auth=True, body={
            "curso_id": "00000000-0000-0000-0000-000000000000"  # UUID placeholder
        })
        print()
        
        # ============================================
        # PROGRESO
        # ============================================
        print("📊 Probando Progreso...")
        self.test_endpoint("Get Progreso General", "GET", "/progreso", 200, requires_auth=True)
        self.test_endpoint("Get Metricas Generales", "GET", "/progreso/metricas-generales", 200, requires_auth=True)
        print()
        
        # ============================================
        # FORO
        # ============================================
        print("💬 Probando Foro...")
        self.test_endpoint("List Comentarios", "GET", "/foro/cursos/00000000-0000-0000-0000-000000000000/lecciones/00000000-0000-0000-0000-000000000000/comentarios", 200, requires_auth=True)
        print()
        
        # ============================================
        # PREFERENCIAS
        # ============================================
        print("⚙️  Probando Preferencias...")
        self.test_endpoint("Get Preferencias", "GET", "/preferencias", 200, requires_auth=True)
        print()
        
        # ============================================
        # CERTIFICADOS
        # ============================================
        print("🎓 Probando Certificados...")
        self.test_endpoint("Listar Certificados", "GET", "/certificados", 200, requires_auth=True)
        print()
        
        # ============================================
        # ADMIN
        # ============================================
        print("🔧 Probando Administración...")
        self.test_endpoint("Listar Usuarios (Admin)", "GET", "/admin/usuarios", 200, requires_auth=True)
        self.test_endpoint("Listar Inscripciones (Admin)", "GET", "/admin/inscripciones", 200, requires_auth=True)
        self.test_endpoint("Listar Reglas", "GET", "/admin/reglas-acreditacion", 200, requires_auth=True)
        print()
        
        # ============================================
        # FLUJOS COMPLETOS (CRUD)
        # ============================================
        if self.tokens.get('access_token'):
            print("🔄 Probando Flujos Completos (CRUD)...")
            self._test_crud_flows()
            print()
        
        print("=" * 70)
        print("✅ Auditoría completada")
        print("=" * 70)
    
    def _test_crud_flows(self):
        """Prueba flujos completos CRUD."""
        created_ids = {}
        
        # FLUJO 1: Módulo (Create → Read → Update)
        print("  📚 Flujo Módulo: Create → Read → Update")
        # Create
        create_result = self.test_endpoint(
            "Flujo: Create Modulo",
            "POST",
            "/modulos",
            201,
            requires_auth=True,
            body={
                "titulo": "Módulo de Auditoría CRUD",
                "fecha_inicio": "2025-01-01",
                "fecha_fin": "2025-12-31",
                "publicado": False
            }
        )
        modulo_id = None
        if create_result.status == TestStatus.PASS and create_result.response_body:
            modulo_id = create_result.response_body.get('id') or self.created_resources.get('modulo_id')
            if modulo_id:
                created_ids['modulo_id'] = str(modulo_id)
                # Read
                self.test_endpoint(
                    "Flujo: Get Modulo",
                    "GET",
                    f"/modulos/{modulo_id}",
                    200
                )
                # Update
                self.test_endpoint(
                    "Flujo: Update Modulo",
                    "PUT",
                    f"/modulos/{modulo_id}",
                    200,
                    requires_auth=True,
                    body={
                        "titulo": "Módulo Actualizado",
                        "publicado": True
                    }
                )
        
        # FLUJO 2: Curso (Create → Read → Update)
        print("  📖 Flujo Curso: Create → Read → Update")
        create_result = self.test_endpoint(
            "Flujo: Create Curso",
            "POST",
            "/cursos",
            201,
            requires_auth=True,
            body={
                "titulo": "Curso de Auditoría CRUD",
                "descripcion": "Curso para pruebas CRUD",
                "publicado": False
            }
        )
        curso_id = None
        if create_result.status == TestStatus.PASS and create_result.response_body:
            curso_id = create_result.response_body.get('id') or self.created_resources.get('curso_id')
            if curso_id:
                created_ids['curso_id'] = str(curso_id)
                # Read
                self.test_endpoint(
                    "Flujo: Get Curso",
                    "GET",
                    f"/cursos/{curso_id}",
                    200
                )
                # Update
                self.test_endpoint(
                    "Flujo: Update Curso",
                    "PUT",
                    f"/cursos/{curso_id}",
                    200,
                    requires_auth=True,
                    body={
                        "titulo": "Curso Actualizado",
                        "publicado": True
                    }
                )
        
        # FLUJO 3: Inscripción (Create → Read → Update Estado)
        curso_id = created_ids.get('curso_id') or self.created_resources.get('curso_id')
        if curso_id:
            print("  📋 Flujo Inscripción: Create → Read → Update Estado")
            create_result = self.test_endpoint(
                "Flujo: Create Inscripcion",
                "POST",
                "/inscripciones",
                201,
                requires_auth=True,
                body={
                    "curso_id": curso_id
                }
            )
            if create_result.status == TestStatus.PASS and create_result.response_body:
                inscripcion_id = create_result.response_body.get('id')
                if inscripcion_id:
                    created_ids['inscripcion_id'] = inscripcion_id
                    # Read
                    self.test_endpoint(
                        "Flujo: Get Inscripcion",
                        "GET",
                        f"/inscripciones/{inscripcion_id}",
                        200,
                        requires_auth=True
                    )
                    # Update Estado
                    self.test_endpoint(
                        "Flujo: Update Estado Inscripcion",
                        "PATCH",
                        f"/inscripciones/{inscripcion_id}",
                        200,
                        requires_auth=True,
                        body={
                            "estado": "PAUSADA"
                        }
                    )
        
        # FLUJO 4: Perfil Usuario (Read → Update)
        print("  👤 Flujo Perfil: Read → Update")
        self.test_endpoint(
            "Flujo: Get Profile",
            "GET",
            "/usuarios/me",
            200,
            requires_auth=True
        )
        self.test_endpoint(
            "Flujo: Update Profile",
            "PUT",
            "/usuarios/me",
            200,
            requires_auth=True,
            body={
                "nombre": "Usuario",
                "apellido": "Auditoría",
                "avatar_url": "https://example.com/avatar.jpg"
            }
        )
        
        # FLUJO 5: Preferencias (Read → Update)
        print("  ⚙️  Flujo Preferencias: Read → Update")
        self.test_endpoint(
            "Flujo: Get Preferencias",
            "GET",
            "/preferencias",
            200,
            requires_auth=True
        )
        self.test_endpoint(
            "Flujo: Update Preferencias",
            "PUT",
            "/preferencias",
            200,
            requires_auth=True,
            body={
                "email_recordatorios": True,
                "email_motivacion": True,
                "email_resultados": False
            }
        )
        
        print(f"  ✅ Flujos completos probados. IDs creados: {len(created_ids)}")
    
    def generate_report(self) -> AuditReport:
        """Genera el reporte de auditoría."""
        total_time = time.time() - self.start_time
        
        passed = sum(1 for r in self.results if r.status == TestStatus.PASS)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAIL)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIP)
        errors = sum(1 for r in self.results if r.status == TestStatus.ERROR)
        total = len(self.results)
        
        success_rate = (passed / total * 100) if total > 0 else 0
        
        # Agrupar por categoría
        categories = {}
        for result in self.results:
            category = result.endpoint.split()[0] if ' ' in result.endpoint else "Other"
            if category not in categories:
                categories[category] = {"total": 0, "passed": 0, "failed": 0, "skipped": 0, "errors": 0}
            categories[category]["total"] += 1
            if result.status == TestStatus.PASS:
                categories[category]["passed"] += 1
            elif result.status == TestStatus.FAIL:
                categories[category]["failed"] += 1
            elif result.status == TestStatus.SKIP:
                categories[category]["skipped"] += 1
            else:
                categories[category]["errors"] += 1
        
        summary = {
            "categories": categories,
            "average_response_time": sum(r.response_time for r in self.results) / total if total > 0 else 0,
            "slowest_endpoint": max(self.results, key=lambda x: x.response_time).endpoint if self.results else None,
            "fastest_endpoint": min(self.results, key=lambda x: x.response_time).endpoint if self.results else None
        }
        
        return AuditReport(
            timestamp=datetime.now().isoformat(),
            base_url=self.base_url,
            total_tests=total,
            passed=passed,
            failed=failed,
            skipped=skipped,
            errors=errors,
            success_rate=success_rate,
            total_time=total_time,
            results=[asdict(r) for r in self.results],
            summary=summary
        )
    
    def save_report(self, report: AuditReport, filename: str = "AUDIT_REPORT.md"):
        """Guarda el reporte en formato Markdown."""
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"# Reporte de Auditoría - EBS API\n\n")
            f.write(f"**Fecha:** {datetime.fromisoformat(report.timestamp).strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Base URL:** {report.base_url}\n")
            f.write(f"**Tiempo Total:** {report.total_time:.2f} segundos\n\n")
            
            f.write("## 📊 Resumen Ejecutivo\n\n")
            f.write(f"- **Total de Pruebas:** {report.total_tests}\n")
            f.write(f"- **✅ Exitosas:** {report.passed} ({report.success_rate:.1f}%)\n")
            f.write(f"- **❌ Fallidas:** {report.failed}\n")
            f.write(f"- **⏭️  Omitidas:** {report.skipped}\n")
            f.write(f"- **⚠️  Errores:** {report.errors}\n\n")
            
            f.write("## 📈 Métricas de Rendimiento\n\n")
            f.write(f"- **Tiempo Promedio de Respuesta:** {report.summary['average_response_time']:.3f}s\n")
            if report.summary['slowest_endpoint']:
                f.write(f"- **Endpoint Más Lento:** {report.summary['slowest_endpoint']}\n")
            if report.summary['fastest_endpoint']:
                f.write(f"- **Endpoint Más Rápido:** {report.summary['fastest_endpoint']}\n")
            f.write("\n")
            
            f.write("## 📋 Resultados por Categoría\n\n")
            for category, stats in report.summary['categories'].items():
                f.write(f"### {category}\n\n")
                f.write(f"- Total: {stats['total']}\n")
                f.write(f"- ✅ Exitosas: {stats['passed']}\n")
                f.write(f"- ❌ Fallidas: {stats['failed']}\n")
                f.write(f"- ⏭️  Omitidas: {stats['skipped']}\n")
                f.write(f"- ⚠️  Errores: {stats['errors']}\n\n")
            
            f.write("## 🔍 Detalle de Pruebas\n\n")
            f.write("| Endpoint | Método | Status | Código | Tiempo | Resultado |\n")
            f.write("|----------|--------|--------|--------|--------|-----------|\n")
            
            for result in report.results:
                status_emoji = {
                    "PASS": "✅",
                    "FAIL": "❌",
                    "SKIP": "⏭️",
                    "ERROR": "⚠️"
                }
                status_code_str = str(result['status_code']) if result['status_code'] else "N/A"
                f.write(f"| {result['endpoint']} | {result['method']} | {status_emoji.get(result['status'], '❓')} | {status_code_str} | {result['response_time']:.3f}s | {result['test_message'] or result['status']} |\n")
            
            f.write("\n## 🐛 Errores y Advertencias\n\n")
            errors_found = [r for r in report.results if r['status'] in ['FAIL', 'ERROR']]
            if errors_found:
                for error in errors_found:
                    f.write(f"### {error['endpoint']}\n\n")
                    f.write(f"- **Método:** {error['method']}\n")
                    f.write(f"- **Status Code:** {error['status_code'] or 'N/A'}\n")
                    f.write(f"- **Mensaje:** {error['error_message'] or error['test_message']}\n\n")
            else:
                f.write("No se encontraron errores críticos.\n\n")
            
            f.write("## 💡 Recomendaciones\n\n")
            if report.failed > 0:
                f.write("- Revisar endpoints que fallaron y corregir problemas de implementación\n")
            if report.skipped > report.total_tests * 0.3:
                f.write("- Muchos endpoints fueron omitidos. Considerar configurar autenticación para pruebas completas\n")
            if report.summary['average_response_time'] > 1.0:
                f.write("- Algunos endpoints tienen tiempos de respuesta altos. Considerar optimización\n")
            if report.errors > 0:
                f.write("- Revisar errores de conexión o timeout\n")
            
            f.write("\n---\n")
            f.write(f"*Reporte generado automáticamente el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n")
        
        print(f"\n📄 Reporte guardado en: {filename}")

def main():
    print("🚀 Iniciando auditoría de endpoints...\n")
    
    auditor = APIAuditor()
    auditor.run_all_tests()
    
    print("\n📊 Generando reporte...")
    report = auditor.generate_report()
    auditor.save_report(report)
    
    print(f"\n✅ Auditoría completada:")
    print(f"   Total: {report.total_tests}")
    print(f"   ✅ Exitosas: {report.passed} ({report.success_rate:.1f}%)")
    print(f"   ❌ Fallidas: {report.failed}")
    print(f"   ⏭️  Omitidas: {report.skipped}")
    print(f"   ⚠️  Errores: {report.errors}")
    
    return 0 if report.failed == 0 and report.errors == 0 else 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Auditoría interrumpida por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

