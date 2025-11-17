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

# Copiar todo el código fuente (incluyendo entrypoint.sh)
COPY --chown=appuser:appuser . .

# Verificar y configurar entrypoint (como root, antes de cambiar usuario)
# Convertir saltos de línea CRLF a LF (necesario en Windows)
# Dar permisos de ejecución
RUN echo "Verificando archivos en /app/..." && \
    ls -la /app/ && \
    if [ -f /app/entrypoint.sh ]; then \
        echo "✓ entrypoint.sh encontrado, configurando..." && \
        sed -i 's/\r$//' /app/entrypoint.sh && \
        chmod +x /app/entrypoint.sh && \
        chown appuser:appuser /app/entrypoint.sh && \
        echo "✓ Entrypoint configurado correctamente" && \
        head -1 /app/entrypoint.sh && \
        ls -la /app/entrypoint.sh; \
    else \
        echo "✗ ERROR: entrypoint.sh no encontrado en /app/" && \
        exit 1; \
    fi

# Cambiar al usuario seguro
USER appuser

# Verificar que el entrypoint es accesible como appuser
RUN ls -la /app/entrypoint.sh && test -x /app/entrypoint.sh && echo "✓ Entrypoint verificado como appuser"

# Puerto que expone el contenedor
EXPOSE 5000

# Usar entrypoint para detectar entorno y ejecutar comando apropiado
# Usar ruta absoluta para evitar problemas en Windows
ENTRYPOINT ["/app/entrypoint.sh"]
