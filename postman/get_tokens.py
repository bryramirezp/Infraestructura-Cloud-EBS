#!/usr/bin/env python3
"""
Script para obtener tokens de Cognito para pruebas en Postman.

Requisitos:
    pip install boto3

Uso:
    python get_tokens.py

Configuración:
    Actualiza las variables USER_POOL_ID, CLIENT_ID, USERNAME y PASSWORD
    según tu configuración de Cognito.
"""

import boto3
import json
import sys
import os

# ============================================
# CONFIGURACIÓN - ACTUALIZA ESTOS VALORES
# ============================================

USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID', 'us-east-1_XXXXX')
CLIENT_ID = os.getenv('COGNITO_CLIENT_ID', 'XXXXX')
REGION = os.getenv('AWS_REGION', 'us-east-1')

# Credenciales de prueba
USERNAME = os.getenv('COGNITO_USERNAME', 'user@example.com')
PASSWORD = os.getenv('COGNITO_PASSWORD', 'Usuario123')

# ============================================

def get_cognito_tokens():
    """Obtiene tokens de Cognito usando ADMIN_NO_SRP_AUTH."""
    try:
        cognito_client = boto3.client('cognito-idp', region_name=REGION)
        
        print(f"🔐 Autenticando usuario: {USERNAME}")
        print(f"📍 User Pool: {USER_POOL_ID}")
        print(f"🌍 Región: {REGION}\n")
        
        response = cognito_client.admin_initiate_auth(
            UserPoolId=USER_POOL_ID,
            ClientId=CLIENT_ID,
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={
                'USERNAME': USERNAME,
                'PASSWORD': PASSWORD
            }
        )
        
        tokens = response['AuthenticationResult']
        
        result = {
            'access_token': tokens['AccessToken'],
            'refresh_token': tokens['RefreshToken'],
            'id_token': tokens['IdToken'],
            'token_type': tokens.get('TokenType', 'Bearer'),
            'expires_in': tokens.get('ExpiresIn', 3600)
        }
        
        print("✅ Autenticación exitosa!\n")
        print("=" * 60)
        print("TOKENS PARA POSTMAN")
        print("=" * 60)
        print("\nCopia estos valores a las variables de entorno en Postman:\n")
        print(f"access_token:")
        print(f"  {result['access_token']}\n")
        print(f"refresh_token:")
        print(f"  {result['refresh_token']}\n")
        print(f"id_token:")
        print(f"  {result['id_token']}\n")
        print("=" * 60)
        print("\nJSON para usar en 'Set Tokens' request:\n")
        print(json.dumps({
            'access_token': result['access_token'],
            'refresh_token': result['refresh_token'],
            'id_token': result['id_token']
        }, indent=2))
        print("\n" + "=" * 60)
        
        # Guardar en archivo para referencia
        with open('tokens.json', 'w') as f:
            json.dump(result, f, indent=2)
        print("\n💾 Tokens guardados en 'tokens.json' (NO compartir este archivo!)")
        
        return result
        
    except cognito_client.exceptions.NotAuthorizedException:
        print("❌ Error: Credenciales inválidas")
        print(f"   Verifica que el usuario '{USERNAME}' exista y la contraseña sea correcta.")
        sys.exit(1)
    except cognito_client.exceptions.UserNotFoundException:
        print(f"❌ Error: Usuario '{USERNAME}' no encontrado")
        print("   Verifica que el usuario exista en el User Pool.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nVerifica:")
        print("  1. Que boto3 esté instalado: pip install boto3")
        print("  2. Que las credenciales de AWS estén configuradas")
        print("  3. Que USER_POOL_ID y CLIENT_ID sean correctos")
        sys.exit(1)


if __name__ == '__main__':
    print("=" * 60)
    print("OBTENER TOKENS DE COGNITO PARA POSTMAN")
    print("=" * 60)
    print()
    
    # Verificar que boto3 esté instalado
    try:
        import boto3
    except ImportError:
        print("❌ Error: boto3 no está instalado")
        print("   Instala con: pip install boto3")
        sys.exit(1)
    
    # Verificar configuración
    if USER_POOL_ID == 'us-east-1_XXXXX' or CLIENT_ID == 'XXXXX':
        print("⚠️  ADVERTENCIA: Configuración por defecto detectada")
        print("   Actualiza USER_POOL_ID y CLIENT_ID en el script")
        print("   O usa variables de entorno:")
        print("     export COGNITO_USER_POOL_ID=us-east-1_XXXXX")
        print("     export COGNITO_CLIENT_ID=XXXXX")
        print()
        respuesta = input("¿Continuar de todas formas? (s/n): ")
        if respuesta.lower() != 's':
            sys.exit(0)
        print()
    
    get_cognito_tokens()

