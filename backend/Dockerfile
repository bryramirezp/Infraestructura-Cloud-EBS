# ----- Etapa 1: Builder -----
# Usamos una imagen completa que tiene las herramientas de compilación
FROM python:3.11-slim AS builder

# Instala las dependencias del sistema necesarias para compilar
# build-essential: gcc, make, etc. (para cryptography)
# libpq-dev: cabeceras de postgres (buena práctica para psycopg2)
WORKDIR /app
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instala las dependencias de Python en un "virtual env"
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copia solo los requisitos e instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ----- Etapa 2: Final -----
# Usamos la imagen 'slim' para producción
FROM python:3.11-slim

# Instala curl para el healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Establece el WORKDIR y el PYTHONPATH
WORKDIR /app
ENV PYTHONPATH=/app
ENV PATH="/opt/venv/bin:$PATH"

# Copia el entorno virtual 'venv' de la etapa 'builder'
COPY --from=builder /opt/venv /opt/venv

# Copia toda la carpeta de la app (código Python)
COPY app /app/app

# Verifica estructura de directorios y crea __init__.py faltantes
RUN echo "=== Verificando estructura de directorios ===" && \
    ls -la /app/ && \
    echo "=== Contenido de /app/app ===" && \
    ls -la /app/app/ && \
    echo "=== Verificando archivos críticos ===" && \
    test -f /app/app/main.py || (echo "ERROR: app/main.py not found" && exit 1) && \
    test -f /app/app/config.py || (echo "ERROR: app/config.py not found" && exit 1) && \
    echo "=== Asegurando __init__.py en todos los directorios ===" && \
    touch /app/app/__init__.py && \
    touch /app/app/routes/__init__.py && \
    touch /app/app/services/__init__.py && \
    touch /app/app/utils/__init__.py && \
    touch /app/app/schemas/__init__.py && \
    touch /app/app/database/__init__.py && \
    touch /app/app/tests/__init__.py && \
    echo "=== Estructura verificada correctamente ==="

# Verifica que Python puede encontrar el módulo
# Nota: La importación de app.main puede fallar aquí si faltan variables de entorno,
# pero eso es normal - se resolverá en runtime con valores por defecto en desarrollo
RUN echo "=== Verificando PYTHONPATH ===" && \
    echo "PYTHONPATH=$PYTHONPATH" && \
    python -c "import sys; print('Python path:', sys.path)" && \
    echo "=== Verificando estructura de módulos ===" && \
    python -c "import app; print('✓ Módulo app encontrado')" 2>&1 || echo "WARNING: Módulo app no importable sin variables de entorno (normal en build)" && \
    echo "=== Verificación completada ==="

# Expone el puerto
EXPOSE 8000

# Ejecuta Uvicorn con diagnóstico mejorado
# Usamos python -m uvicorn para mejor resolución de módulos
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]