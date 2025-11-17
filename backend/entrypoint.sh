#!/bin/sh
# Entrypoint script que detecta el entorno y ejecuta el comando apropiado
# Desarrollo: uvicorn con --reload
# Producción: gunicorn con workers optimizados

# Si falla un comando, salir inmediatamente
set -e

# Activar entorno virtual explícitamente (por seguridad)
. /opt/venv/bin/activate

if [ "$ENVIRONMENT" = "development" ]; then
    echo "🚀 Modo DESARROLLO detectado"
    # Reload activo, escucha en 0.0.0.0
    exec uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
else
    echo "🛡️ Modo PRODUCCIÓN detectado"
    
    # Configuración de workers basada en CPU disponible si no se define
    # En App Runner, mejor definir GUNICORN_WORKERS explícitamente en las variables de entorno
    WORKERS=${GUNICORN_WORKERS:-2}
    
    echo "Iniciando Gunicorn con $WORKERS workers..."
    
    # exec es CRÍTICO para que Gunicorn reciba señales de parada de AWS (SIGTERM)
    exec gunicorn app.main:app \
        --workers $WORKERS \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:5000 \
        --timeout 120 \
        --keep-alive 5 \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --log-level info \
        --access-logfile -
fi
