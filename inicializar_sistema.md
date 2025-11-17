# Comandos para Inicializar el Sistema EBS

## Desarrollo Local (con hot-reload)

### Primera vez o después de cambios en Dockerfile

```bash
docker-compose up --build
```

### Si ya están construidas las imágenes

```bash
docker-compose up
```

### En segundo plano (detached)

```bash
docker-compose up -d
```

### Ver logs en tiempo real

```bash
docker-compose logs -f backend
```

### Ver logs de todos los servicios

```bash
docker-compose logs -f
```

## Testing de Producción Local

### Construir y levantar en modo producción (sin hot-reload)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

### En segundo plano

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Comandos Útiles

### Detener servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (limpia la base de datos)

```bash
docker-compose down -v
```

### Reconstruir solo el backend

```bash
docker-compose build backend
```

### Reconstruir todo

```bash
docker-compose build --no-cache
```

### Ejecutar comandos dentro del contenedor backend

```bash
docker-compose exec backend sh
```

### Ver estado de los servicios

```bash
docker-compose ps
```

### Ver logs del último inicio

```bash
docker-compose logs
```

### Reiniciar un servicio específico

```bash
docker-compose restart backend
```

### Detener un servicio específico

```bash
docker-compose stop backend
```

### Iniciar un servicio específico

```bash
docker-compose start backend
```

## Verificación

### Verificar que el backend está funcionando

```bash
curl http://localhost:5000/health
```

### Verificar que la base de datos está funcionando

```bash
docker-compose exec db pg_isready -U ebs_user -d ebs_db
```

## Notas Importantes

- El archivo `docker-compose.override.yml` se carga automáticamente en desarrollo
- En desarrollo, el código se monta como volumen para hot-reload
- El `entrypoint.sh` detecta automáticamente `ENVIRONMENT=development` y ejecuta `uvicorn --reload`
- En producción, el `entrypoint.sh` ejecuta `gunicorn` con workers optimizados
- La base de datos se inicializa automáticamente con los scripts SQL en `database/`
- **AWS App Runner**: NO usa docker-compose. Solo construye desde Dockerfile y lee variables de entorno de la consola AWS

## Variables de Entorno

Asegúrate de tener un archivo `.env` en la raíz del proyecto con las siguientes variables:

- `POSTGRES_USER` - Usuario de PostgreSQL
- `POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- `POSTGRES_DB` - Nombre de la base de datos
- `COGNITO_USER_POOL_ID` - ID del User Pool de Cognito
- `COGNITO_CLIENT_ID` - ID del cliente de Cognito
- `COGNITO_REDIRECT_URI` - URI de redirección de OAuth
- `S3_BUCKET_NAME` - Nombre del bucket de S3
- `AWS_ACCESS_KEY_ID` - Access Key de AWS
- `AWS_SECRET_ACCESS_KEY` - Secret Key de AWS
- `GUNICORN_WORKERS` - Número de workers (opcional, default: 2)
- `ENVIRONMENT` - Entorno: `development` o `production` (opcional, default: development)

## Flujo de Trabajo Recomendado

### Desarrollo

1. Asegúrate de tener el archivo `.env` configurado
2. Ejecuta `docker-compose up --build` la primera vez
3. Para siguientes inicios, usa `docker-compose up`
4. El código se recarga automáticamente cuando haces cambios

### Testing de Producción Local

1. Ejecuta `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build`
2. Verifica que gunicorn se inicia correctamente
3. Prueba los endpoints para asegurar que todo funciona

### Despliegue a AWS App Runner

1. Construye la imagen: `docker build -t ebs-backend ./backend`
2. Sube la imagen a ECR (si es necesario)
3. Configura App Runner para usar el Dockerfile
4. Configura las variables de entorno en la consola AWS
5. Asegúrate de que `DATABASE_URL` apunte a tu RDS
