import jwt
from jwt.exceptions import InvalidTokenError, DecodeError
import requests
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict
import logging
from datetime import datetime, timedelta
from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


class JWKSCache:
    """Cache for JWKS to avoid repeated requests to Cognito"""
    
    def __init__(self, ttl_seconds: int = 3600):
        self._jwks: Optional[Dict] = None
        self._expires_at: Optional[datetime] = None
        self._ttl = timedelta(seconds=ttl_seconds)
    
    def get(self) -> Optional[Dict]:
        """Get cached JWKS if still valid"""
        if self._jwks and self._expires_at and datetime.now() < self._expires_at:
            return self._jwks
        return None
    
    def set(self, jwks: Dict):
        """Cache JWKS with expiration"""
        self._jwks = jwks
        self._expires_at = datetime.now() + self._ttl
    
    def clear(self):
        """Clear cache"""
        self._jwks = None
        self._expires_at = None


_jwks_cache = JWKSCache(ttl_seconds=3600)


def get_jwks() -> Dict:
    """Get JWKS from Cognito with caching"""
    cached = _jwks_cache.get()
    if cached:
        logger.debug("Using cached JWKS")
        return cached
    
    try:
        jwks_url = f"{settings.cognito_issuer}/.well-known/jwks.json"
        logger.info(f"Fetching JWKS from {jwks_url}")
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        jwks = response.json()
        _jwks_cache.set(jwks)
        return jwks
    except requests.RequestException as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch authentication keys"
        )


def get_rsa_key(token: str) -> str:
    """Extract RSA public key from JWKS for token verification"""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except (InvalidTokenError, DecodeError) as e:
        logger.warning(f"Invalid token header: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header"
        )
    
    jwks = get_jwks()
    kid = unverified_header.get("kid")
    
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing key ID"
        )
    
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import serialization
    import base64
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            n_str = key.get("n")
            e_str = key.get("e")
            
            n_bytes = base64.urlsafe_b64decode(n_str + "==" * (4 - len(n_str) % 4))
            e_bytes = base64.urlsafe_b64decode(e_str + "==" * (4 - len(e_str) % 4))
            
            n_int = int.from_bytes(n_bytes, byteorder="big")
            e_int = int.from_bytes(e_bytes, byteorder="big")
            
            public_key = rsa.RSAPublicNumbers(e_int, n_int).public_key(default_backend())
            pem_key = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            return pem_key.decode("utf-8")
    
    logger.warning(f"Key ID {kid} not found in JWKS")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find appropriate key for token verification"
    )


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict:
    """Verify JWT token from Cognito and return payload"""
    token = credentials.credentials
    
    try:
        public_key = get_rsa_key(token)
        
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=None,
            issuer=settings.cognito_issuer,
            options={
                "verify_signature": True,
                "verify_aud": False,
                "verify_exp": True,
            }
        )
        
        logger.debug(f"Token verified for user: {payload.get('sub', 'unknown')}")
        return payload
        
    except (InvalidTokenError, DecodeError) as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token verification error"
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict:
    """Dependency to get current authenticated user from token"""
    return verify_token(credentials)


def get_user_id_from_token(token_payload: Dict) -> Optional[str]:
    """Extract user ID (sub) from token payload"""
    return token_payload.get("sub")


def get_user_groups_from_token(token_payload: Dict) -> list[str]:
    """Extract user groups from token payload"""
    groups = token_payload.get("cognito:groups", [])
    if isinstance(groups, str):
        return [groups]
    return groups if isinstance(groups, list) else []

