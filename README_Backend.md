# Guía de Desarrollo - Backend (FastAPI)

## Arquitectura

- **Framework**: FastAPI (Python)
- **Estructura**: Monolito modular
- **Base de datos**: PostgreSQL
- **Autenticación**: Amazon Cognito (validación de JWT)
- **Almacenamiento**: S3 (URLs prefirmadas)
- **Contenedorización**: Docker
- **Despliegue**: AWS ECS Fargate

## Fase 0: Configuración y Definición del Contrato (FastAPI-First)

### Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   ├── database/
│   ├── schemas/
│   └── utils/
├── Dockerfile
├── requirements.txt
└── docker-compose.yml
```

### Dockerfile

Crear `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
boto3==1.29.7
reportlab==4.0.7
pydantic==2.5.0
pydantic-settings==2.1.0
sqlalchemy==2.0.23
alembic==1.12.1
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

### docker-compose.yml (Raíz del proyecto)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ebs_user
      POSTGRES_PASSWORD: ebs_password
      POSTGRES_DB: ebs_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ebs_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://ebs_user:ebs_password@db:5432/ebs_db
      AWS_REGION: us-east-1
      COGNITO_USER_POOL_ID: ${COGNITO_USER_POOL_ID}
      COGNITO_CLIENT_ID: ${COGNITO_CLIENT_ID}
      S3_BUCKET_NAME: ${S3_BUCKET_NAME}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/app:/app

volumes:
  postgres_data:
```

### Tarea Crítica: Definición del Contrato API

Crear endpoints iniciales con modelos Pydantic (sin lógica de negocio):

#### app/schemas/course.py

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseBase(BaseModel):
    name: str
    description: str

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudyGuideResponse(BaseModel):
    course_id: int
    file_name: str
    presigned_url: str
    expires_in: int
```

#### app/schemas/exam.py

```python
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

class Question(BaseModel):
    id: int
    question_text: str
    options: List[str]
    correct_answer: int

class ExamResponse(BaseModel):
    id: int
    course_id: int
    questions: List[Question]
    time_limit_minutes: Optional[int] = None

class ExamSubmission(BaseModel):
    exam_id: int
    answers: Dict[int, int]

class ExamResult(BaseModel):
    exam_id: int
    score: float
    percentage: float
    passed: bool
    attempts_remaining: int
    certificate_url: Optional[str] = None
```

#### app/schemas/user.py

```python
from pydantic import BaseModel
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    COORDINATOR = "coordinator"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: str
    role: UserRole

class User(UserBase):
    id: int
    cognito_user_id: str
    
    class Config:
        from_attributes = True
```

#### app/schemas/progress.py

```python
from pydantic import BaseModel
from typing import Optional

class ProgressResponse(BaseModel):
    user_id: int
    course_id: int
    progress_percentage: float
    completed_modules: int
    total_modules: int
    last_accessed: Optional[str] = None

class ProgressComparison(BaseModel):
    user_id: int
    course_id: int
    user_percentage: float
    average_percentage: float
    rank: int
    total_students: int
```

#### app/routes/courses.py

```python
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.course import Course, CourseCreate, StudyGuideResponse
from typing import List

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.get("/", response_model=List[Course])
async def get_courses():
    pass

@router.get("/{course_id}", response_model=Course)
async def get_course(course_id: int):
    pass

@router.get("/{course_id}/study-guides", response_model=List[StudyGuideResponse])
async def get_study_guides(course_id: int):
    pass
```

#### app/routes/exams.py

```python
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.exam import ExamResponse, ExamSubmission, ExamResult
from typing import List

router = APIRouter(prefix="/api/exams", tags=["exams"])

@router.get("/course/{course_id}", response_model=ExamResponse)
async def get_exam(course_id: int):
    pass

@router.post("/submit", response_model=ExamResult)
async def submit_exam(submission: ExamSubmission):
    pass

@router.post("/{exam_id}/retake")
async def retake_exam(exam_id: int):
    pass
```

#### app/routes/progress.py

```python
from fastapi import APIRouter, Depends
from app.schemas.progress import ProgressResponse, ProgressComparison
from typing import List

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/user/{user_id}", response_model=List[ProgressResponse])
async def get_user_progress(user_id: int):
    pass

@router.get("/user/{user_id}/course/{course_id}/comparison", response_model=ProgressComparison)
async def get_progress_comparison(user_id: int, course_id: int):
    pass
```

#### app/routes/certificates.py

```python
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from app.schemas.certificate import CertificateResponse

router = APIRouter(prefix="/api/certificates", tags=["certificates"])

@router.get("/user/{user_id}/course/{course_id}", response_model=CertificateResponse)
async def get_certificate(user_id: int, course_id: int):
    pass

@router.get("/user/{user_id}/course/{course_id}/download")
async def download_certificate(user_id: int, course_id: int):
    pass
```

#### app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import courses, exams, progress, certificates

app = FastAPI(
    title="EBS API",
    description="API para Plataforma Digital Escuela Bíblica Salem",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router)
app.include_router(exams.router)
app.include_router(progress.router)
app.include_router(certificates.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Sincronización

1. Ejecutar `docker-compose up --build`
2. Verificar que el servicio esté disponible en `http://localhost:8000`
3. Acceder a la documentación automática en `http://localhost:8000/docs`
4. **Compartir la URL `/docs` con el desarrollador de Frontend** (este es el contrato oficial)

## Fase 1: Desarrollo (Implementación de API)

### Autenticación con Cognito

#### app/utils/auth.py

```python
from jose import JWTError, jwt
from jose.utils import base64url_decode
import json
import requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os

security = HTTPBearer()

COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_REGION = os.getenv("AWS_REGION", "us-east-1")
COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"

def get_jwks():
    jwks_url = f"{COGNITO_ISSUER}/.well-known/jwks.json"
    response = requests.get(jwks_url)
    return response.json()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials
    
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token header")
    
    jwks = get_jwks()
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
    
    if not rsa_key:
        raise HTTPException(status_code=401, detail="Unable to find appropriate key")
    
    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=None,
            issuer=COGNITO_ISSUER,
            options={"verify_signature": True, "verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    return verify_token(credentials)
```

### Endpoints Core: Cursos (RF-02, RF-05)

#### app/services/s3_service.py

```python
import boto3
from botocore.config import Config
import os
from datetime import timedelta

s3_client = boto3.client(
    's3',
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    config=Config(signature_version='s3v4')
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

def generate_presigned_url(file_key: str, expiration: int = 3600) -> str:
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': file_key},
        ExpiresIn=expiration
    )
    return url
```

#### app/services/course_service.py

```python
from sqlalchemy.orm import Session
from app.models.course import Course, StudyGuide
from app.services.s3_service import generate_presigned_url
from app.schemas.course import StudyGuideResponse

def get_courses(db: Session):
    return db.query(Course).all()

def get_study_guides(db: Session, course_id: int) -> list[StudyGuideResponse]:
    guides = db.query(StudyGuide).filter(StudyGuide.course_id == course_id).all()
    return [
        StudyGuideResponse(
            course_id=guide.course_id,
            file_name=guide.file_name,
            presigned_url=generate_presigned_url(guide.s3_key),
            expires_in=3600
        )
        for guide in guides
    ]
```

### Endpoints de Evaluación (RF-01, RF-03, RF-11)

#### app/services/exam_service.py

```python
from sqlalchemy.orm import Session
from app.models.exam import Exam, ExamAttempt, Question
from app.schemas.exam import ExamSubmission, ExamResult
from typing import Dict

MIN_PASSING_SCORE = 80.0
MAX_ATTEMPTS = 3

def calculate_score(answers: Dict[int, int], questions: list[Question]) -> float:
    correct = 0
    total = len(questions)
    
    for question in questions:
        if answers.get(question.id) == question.correct_answer:
            correct += 1
    
    return (correct / total) * 100

def submit_exam(db: Session, user_id: int, submission: ExamSubmission) -> ExamResult:
    exam = db.query(Exam).filter(Exam.id == submission.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    attempts = db.query(ExamAttempt).filter(
        ExamAttempt.user_id == user_id,
        ExamAttempt.exam_id == submission.exam_id
    ).count()
    
    if attempts >= MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Maximum attempts reached")
    
    questions = db.query(Question).filter(Question.exam_id == submission.exam_id).all()
    score = calculate_score(submission.answers, questions)
    passed = score >= MIN_PASSING_SCORE
    
    attempt = ExamAttempt(
        user_id=user_id,
        exam_id=submission.exam_id,
        score=score,
        answers=submission.answers,
        passed=passed
    )
    db.add(attempt)
    db.commit()
    
    attempts_remaining = MAX_ATTEMPTS - (attempts + 1)
    certificate_url = None
    
    if passed:
        certificate_url = generate_certificate(user_id, exam.course_id)
    
    return ExamResult(
        exam_id=submission.exam_id,
        score=score,
        percentage=score,
        passed=passed,
        attempts_remaining=attempts_remaining,
        certificate_url=certificate_url
    )

def retake_exam(db: Session, user_id: int, exam_id: int):
    attempts = db.query(ExamAttempt).filter(
        ExamAttempt.user_id == user_id,
        ExamAttempt.exam_id == exam_id
    ).count()
    
    if attempts < MAX_ATTEMPTS:
        last_attempt = db.query(ExamAttempt).filter(
            ExamAttempt.user_id == user_id,
            ExamAttempt.exam_id == exam_id
        ).order_by(ExamAttempt.created_at.desc()).first()
        
        if last_attempt and not last_attempt.passed:
            return {"message": "Retake allowed", "attempts_remaining": MAX_ATTEMPTS - attempts}
    
    raise HTTPException(status_code=400, detail="Retake not allowed")
```

### Endpoints de Certificación (RF-04)

#### app/services/certificate_service.py

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import boto3
from datetime import datetime
import os

def generate_certificate(user_id: int, course_id: int) -> str:
    s3_client = boto3.client('s3')
    bucket_name = os.getenv("S3_BUCKET_NAME")
    
    filename = f"certificates/{user_id}_{course_id}_{datetime.now().timestamp()}.pdf"
    local_path = f"/tmp/{filename}"
    
    c = canvas.Canvas(local_path, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 2 * inch, "CERTIFICADO DE APROBACIÓN")
    
    c.setFont("Helvetica", 16)
    c.drawCentredString(width / 2, height - 3 * inch, f"Curso ID: {course_id}")
    c.drawCentredString(width / 2, height - 3.5 * inch, f"Usuario ID: {user_id}")
    c.drawCentredString(width / 2, height - 4 * inch, f"Fecha: {datetime.now().strftime('%Y-%m-%d')}")
    
    c.save()
    
    s3_client.upload_file(local_path, bucket_name, filename)
    os.remove(local_path)
    
    return filename
```

### Endpoints de Roles (RF-12)

#### app/utils/roles.py

```python
from fastapi import HTTPException
from app.utils.auth import get_current_user
from app.schemas.user import UserRole

def require_role(allowed_roles: list[UserRole]):
    def role_checker(current_user: dict = get_current_user):
        user_role = current_user.get("cognito:groups", [])
        if not any(role in user_role for role in allowed_roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker
```

#### Uso en rutas

```python
from app.utils.roles import require_role
from app.schemas.user import UserRole

@router.get("/admin/users")
async def get_all_users(current_user = Depends(require_role([UserRole.ADMIN]))):
    pass
```

## Fase 2: Integración y Despliegue (Staging)

### Despliegue en ECS Fargate

1. Construir imagen Docker: `docker build -t ebs-backend:latest ./backend`
2. Publicar imagen en ECR (Elastic Container Registry)
3. Configurar servicio ECS Fargate con:
   - Task Definition que use la imagen
   - Variables de entorno para Cognito, S3, RDS
   - Health check en `/health`
4. Configurar Application Load Balancer con HTTPS
5. **Proveer URL del API de staging al desarrollador de Frontend**

### Variables de Entorno en Producción

```env
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/ebs_db
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
AWS_REGION=us-east-1
S3_BUCKET_NAME=ebs-storage
```

## Fase 3: Pruebas y Producción

### Pruebas Unitarias

#### tests/test_exam_service.py

```python
import pytest
from app.services.exam_service import calculate_score, MIN_PASSING_SCORE, MAX_ATTEMPTS

def test_calculate_score():
    questions = [
        Question(id=1, correct_answer=0),
        Question(id=2, correct_answer=1),
    ]
    answers = {1: 0, 2: 1}
    score = calculate_score(answers, questions)
    assert score == 100.0

def test_min_passing_score():
    assert MIN_PASSING_SCORE == 80.0

def test_max_attempts():
    assert MAX_ATTEMPTS == 3
```

### Ejecutar Pruebas en Docker

```dockerfile
# Agregar a Dockerfile para tests
RUN pip install pytest pytest-asyncio httpx

CMD ["pytest", "tests/", "-v"]
```

### Seguridad

1. Validar todos los endpoints protegidos con `get_current_user`
2. Verificar flujos de Cognito (login, registro, recuperación de contraseña)
3. Validar CORS en producción
4. Implementar rate limiting
5. Validar entrada con Pydantic en todos los endpoints
6. Usar conexiones SSL para RDS
7. Rotar credenciales de AWS periódicamente

### Reglas de Negocio Críticas

- **RF-03**: Calificación mínima del 80% para aprobar
- **RF-03**: Máximo de 3 intentos por examen
- **RF-04**: Generación automática de certificado al aprobar
- **RF-11**: Permitir recursamiento si no se aprueba
- **RF-12**: Validar roles (Alumno, Coordinador, Admin) en endpoints protegidos

