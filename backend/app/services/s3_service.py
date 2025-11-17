import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional
import logging

from app.config import settings
from app.utils.exceptions import EBSException

logger = logging.getLogger(__name__)


class S3Service:
    """Servicio para operaciones con Amazon S3"""

    def __init__(self):
        """Inicializar cliente S3"""
        self.bucket_name = settings.s3_bucket_name
        self.region = settings.aws_region
        
        session_params = {
            "region_name": self.region,
        }
        
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            session_params["aws_access_key_id"] = settings.aws_access_key_id
            session_params["aws_secret_access_key"] = settings.aws_secret_access_key
        
        session = boto3.Session(**session_params)
        self.s3_client = session.client("s3")
        self.s3_resource = session.resource("s3")

    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        http_method: str = "GET"
    ) -> str:
        """
        Generar URL prefirmada para acceso temporal a objeto S3
        
        Args:
            s3_key: Clave del objeto en S3
            expiration: Tiempo de expiración en segundos (default: 1 hora)
            http_method: Método HTTP (GET o PUT)
            
        Returns:
            URL prefirmada
            
        Raises:
            EBSException: Si ocurre error al generar URL
        """
        try:
            params = {
                "Bucket": self.bucket_name,
                "Key": s3_key,
            }
            
            if http_method == "PUT":
                params["ContentType"] = "application/octet-stream"
            
            url = self.s3_client.generate_presigned_url(
                ClientMethod=f"{http_method.lower()}_object",
                Params=params,
                ExpiresIn=expiration
            )
            
            logger.info(f"Generated presigned URL for {s3_key}, expires in {expiration}s")
            return url
            
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            logger.error(f"Error generating presigned URL for {s3_key}: {error_code}")
            raise EBSException(
                status_code=500,
                detail=f"Error generating presigned URL: {error_code}",
                error_code="S3_PRESIGNED_URL_ERROR"
            )
        except BotoCoreError as e:
            logger.error(f"BotoCore error generating presigned URL: {str(e)}")
            raise EBSException(
                status_code=500,
                detail="Error connecting to S3",
                error_code="S3_CONNECTION_ERROR"
            )

    def upload_file(
        self,
        file_content: bytes,
        s3_key: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> str:
        """
        Subir archivo a S3
        
        Args:
            file_content: Contenido del archivo en bytes
            s3_key: Clave del objeto en S3
            content_type: Tipo MIME del contenido
            metadata: Metadatos adicionales opcionales
            
        Returns:
            Clave S3 del archivo subido
            
        Raises:
            EBSException: Si ocurre error al subir archivo
        """
        try:
            extra_args = {"ContentType": content_type}
            
            if metadata:
                extra_args["Metadata"] = {str(k): str(v) for k, v in metadata.items()}
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                **extra_args
            )
            
            logger.info(f"File uploaded to S3: {s3_key}")
            return s3_key
            
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            logger.error(f"Error uploading file to S3 {s3_key}: {error_code}")
            raise EBSException(
                status_code=500,
                detail=f"Error uploading file to S3: {error_code}",
                error_code="S3_UPLOAD_ERROR"
            )
        except BotoCoreError as e:
            logger.error(f"BotoCore error uploading file: {str(e)}")
            raise EBSException(
                status_code=500,
                detail="Error connecting to S3",
                error_code="S3_CONNECTION_ERROR"
            )

    def delete_file(self, s3_key: str) -> bool:
        """
        Eliminar archivo de S3
        
        Args:
            s3_key: Clave del objeto en S3
            
        Returns:
            True si se eliminó exitosamente
            
        Raises:
            EBSException: Si ocurre error al eliminar archivo
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"File deleted from S3: {s3_key}")
            return True
            
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            logger.error(f"Error deleting file from S3 {s3_key}: {error_code}")
            raise EBSException(
                status_code=500,
                detail=f"Error deleting file from S3: {error_code}",
                error_code="S3_DELETE_ERROR"
            )
        except BotoCoreError as e:
            logger.error(f"BotoCore error deleting file: {str(e)}")
            raise EBSException(
                status_code=500,
                detail="Error connecting to S3",
                error_code="S3_CONNECTION_ERROR"
            )

    def file_exists(self, s3_key: str) -> bool:
        """
        Verificar si un archivo existe en S3
        
        Args:
            s3_key: Clave del objeto en S3
            
        Returns:
            True si el archivo existe, False en caso contrario
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "404":
                return False
            logger.warning(f"Error checking file existence {s3_key}: {error_code}")
            return False
        except Exception:
            return False

    def get_file_url(self, s3_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Obtener URL prefirmada para descarga de archivo
        
        Args:
            s3_key: Clave del objeto en S3
            expiration: Tiempo de expiración en segundos (default: 1 hora)
            
        Returns:
            URL prefirmada o None si el archivo no existe
        """
        if not self.file_exists(s3_key):
            return None
        
        return self.generate_presigned_url(s3_key, expiration=expiration, http_method="GET")

    @staticmethod
    def build_s3_key(folder: str, filename: str) -> str:
        """
        Construir clave S3 estructurada
        
        Args:
            folder: Carpeta/prefix (ej: 'certificados', 'guias-estudio')
            filename: Nombre del archivo
            
        Returns:
            Clave S3 completa
        """
        folder = folder.strip("/")
        filename = filename.lstrip("/")
        return f"{folder}/{filename}"

    @staticmethod
    def build_certificate_key(certificado_id: str) -> str:
        """Construir clave S3 para certificado"""
        return S3Service.build_s3_key("certificados", f"{certificado_id}.pdf")

    @staticmethod
    def build_guide_key(guia_id: str, filename: str) -> str:
        """Construir clave S3 para guía de estudio"""
        return S3Service.build_s3_key("guias-estudio", f"{guia_id}/{filename}")


def get_s3_service() -> S3Service:
    """Obtener instancia del servicio S3"""
    return S3Service()

