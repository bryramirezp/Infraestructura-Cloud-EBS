# /backend/Dockerfile
# Este Dockerfile está diseñado para funcionar con 'context: ./backend'
# y una estructura de código en 'backend/app/main.py'
# Multi-stage build para optimizar tamaño y seguridad

# ---------------------------
# Stage 1: Builder
# ---------------------------
FROM python:3.11-slim as builder

# Evita archivos .pyc y buffering
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias de sistema necesarias para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear entorno virtual
RUN python -m venv /opt/venv

# Activar entorno virtual para las instalaciones
ENV PATH="/opt/venv/bin:$PATH"

# Copiar y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---------------------------
# Stage 2: Runtime
# ---------------------------
FROM python:3.11-slim

WORKDIR /app

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario sin privilegios
RUN useradd -m -r appuser && \
    chown appuser /app

# Copiar entorno virtual desde el builder
COPY --from=builder /opt/venv /opt/venv

# Activar entorno virtual
ENV PATH="/opt/venv/bin:$PATH"

# Copiar código fuente y dar permisos
COPY --chown=appuser:appuser . .

# Convertir saltos de línea a LF y dar permisos de ejecución al entrypoint (como root, antes de cambiar usuario)
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    head -1 /app/entrypoint.sh

# Cambiar al usuario seguro
USER appuser

# Puerto que expone el contenedor
EXPOSE 5000

# Usar entrypoint para detectar entorno y ejecutar comando apropiado
ENTRYPOINT ["./entrypoint.sh"]
