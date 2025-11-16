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

# Copia toda la carpeta backend primero
COPY . /app/

# Verifica que app/main.py existe
RUN ls -la /app/ && ls -la /app/app/ || echo "WARNING: app directory structure incorrect"

# Crea __init__.py si no existe
RUN touch /app/app/__init__.py

# Expone el puerto
EXPOSE 8000

# Ejecuta Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]