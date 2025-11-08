import json
import os
import pymysql
import boto3
from datetime import datetime
import logging

# Configuración de logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configuración de RDS
DB_CONFIG = {
    'host': os.environ.get('RDS_HOST'),
    'user': os.environ.get('RDS_USERNAME'),
    'password': os.environ.get('RDS_PASSWORD'),
    'database': os.environ.get('RDS_DATABASE'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    """Obtiene una conexión a la base de datos"""
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        logger.error(f"Error conectando a la base de datos: {str(e)}")
        raise

def post_confirmation(event, context):
    """
    POST CONFIRMATION TRIGGER
    Se ejecuta cuando un usuario confirma su cuenta en Cognito
    """
    logger.info('🔥 Post Confirmation Trigger: %s', json.dumps(event, indent=2))
    
    try:
        user_name = event.get('userName', '')
        request = event.get('request', {})
        user_attributes = request.get('userAttributes', {})
        
        # Extraer datos del usuario de Cognito
        cognito_sub = user_attributes.get('sub', '')
        email = user_attributes.get('email', '')
        name = user_attributes.get('name') or user_attributes.get('given_name') or email
        role = user_attributes.get('custom:role', 'student')
        
        # Conectar a RDS
        connection = get_db_connection()
        
        try:
            with connection.cursor() as cursor:
                # Verificar si el usuario ya existe
                cursor.execute(
                    "SELECT id FROM users WHERE cognito_sub = %s",
                    (cognito_sub,)
                )
                existing_user = cursor.fetchone()
                
                if not existing_user:
                    # Crear usuario en RDS
                    cursor.execute(
                        """INSERT INTO users 
                           (id, cognito_sub, email, name, role, created_at, updated_at) 
                           VALUES (%s, %s, %s, %s, %s, NOW(), NOW())""",
                        (cognito_sub, cognito_sub, email, name, role)
                    )
                    connection.commit()
                    
                    logger.info('✅ Usuario creado en RDS: %s', {
                        'cognito_sub': cognito_sub,
                        'email': email,
                        'name': name,
                        'role': role
                    })
                else:
                    logger.info('ℹ️ Usuario ya existe en RDS: %s', cognito_sub)
                    
        finally:
            connection.close()
        
        return event
        
    except Exception as e:
        logger.error('❌ Error en Post Confirmation: %s', str(e))
        # No lanzamos error para no bloquear el flujo de Cognito
        return event

def pre_token_generation(event, context):
    """
    PRE TOKEN GENERATION TRIGGER
    Agrega claims personalizados al JWT
    """
    logger.info('🔑 Pre Token Generation Trigger: %s', json.dumps(event, indent=2))
    
    try:
        user_name = event.get('userName', '')
        request = event.get('request', {})
        user_attributes = request.get('userAttributes', {})
        
        # Obtener datos adicionales de RDS
        connection = get_db_connection()
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT role, name, email FROM users WHERE cognito_sub = %s",
                    (user_attributes.get('sub'),)
                )
                user_data = cursor.fetchone()
                
                if user_data:
                    # Agregar claims personalizados al token
                    event['response'] = {
                        'claimsOverrideDetails': {
                            'claimsToAddOrOverride': {
                                'custom:role': user_data['role'],
                                'custom:name': user_data['name'],
                                'custom:email': user_data['email'],
                                'custom:user_id': user_attributes.get('sub')
                            }
                        }
                    }
                    
                    logger.info('✅ Claims agregados al token: %s', user_data)
                    
        finally:
            connection.close()
        
        return event
        
    except Exception as e:
        logger.error('❌ Error en Pre Token Generation: %s', str(e))
        return event

def post_authentication(event, context):
    """
    POST AUTHENTICATION TRIGGER
    Actualiza el último login del usuario
    """
    logger.info('🔐 Post Authentication Trigger: %s', json.dumps(event, indent=2))
    
    try:
        user_name = event.get('userName', '')
        request = event.get('request', {})
        user_attributes = request.get('userAttributes', {})
        
        # Actualizar último login en RDS
        connection = get_db_connection()
        
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE cognito_sub = %s",
                    (user_attributes.get('sub'),)
                )
                connection.commit()
                
                logger.info('✅ Último login actualizado para: %s', user_attributes.get('sub'))
                
        finally:
            connection.close()
        
        return event
        
    except Exception as e:
        logger.error('❌ Error en Post Authentication: %s', str(e))
        return event
