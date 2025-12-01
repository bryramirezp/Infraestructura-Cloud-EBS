from fastapi import APIRouter, Request, status, Body
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import jwt
from jwt.exceptions import InvalidTokenError, DecodeError
import secrets

from app.services.cognito_service import CognitoService
from app.config import settings
from app.utils.exceptions import AuthenticationError, EBSException
from app.utils.jwt_auth import get_rsa_key
from app.utils.roles import get_user_role, UserRole

router = APIRouter()
service = CognitoService()


class SetTokensRequest(BaseModel):
    """Request model for setting tokens"""
    access_token: str
    refresh_token: str
    id_token: str


def _pkce_cookie_name(state: str) -> str:
    return f"pkce_{state}"


@router.get("/login")
async def login(request: Request):
    """
    Iniciar flujo de autenticación PKCE con Cognito Hosted UI.
    
    Genera la URL de autorización de Cognito con PKCE y redirige al usuario.
    El code_verifier se almacena en una cookie HTTP-only para validación posterior.
    """
    # Generate state and nonce for security
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    
    # Build authorization URL with PKCE
    authorize_url, code_verifier = await service.build_authorization_url(state=state, nonce=nonce)
    
    # Create redirect response to Cognito Hosted UI
    redirect_response = RedirectResponse(url=authorize_url, status_code=status.HTTP_302_FOUND)
    
    # Determine cookie security settings
    # Force secure=False in development to ensure cookies work on localhost (HTTP)
    is_secure = settings.cookie_secure
    if settings.is_development:
        is_secure = False
        
    # Store state and PKCE verifier in HTTP-only cookies
    redirect_response.set_cookie(
        "auth_state",
        state,
        max_age=600,  # 10 minutes
        httponly=True,
        secure=is_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )
    
    pkce_name = _pkce_cookie_name(state)
    redirect_response.set_cookie(
        pkce_name,
        code_verifier,
        max_age=600,  # 10 minutes
        httponly=True,
        secure=is_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )
    
    # Store nonce for token validation (optional, but recommended)
    redirect_response.set_cookie(
        "auth_nonce",
        nonce,
        max_age=600,
        httponly=True,
        secure=is_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )
    
    return redirect_response


@router.get("/callback")
@router.post("/callback")
async def callback(request: Request):
    """Handle OAuth2 callback: exchange code for tokens and set auth cookies.
    
    Supports both GET (from Cognito redirect) and POST (from frontend with code_verifier).
    If code_verifier is in request body (POST), use it. Otherwise, try to get from cookies (GET).
    """
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code or not state:
        raise AuthenticationError("Missing code or state in callback")

    # Try to get code_verifier from request body (POST from frontend) or cookies (GET from direct redirect)
    code_verifier = None
    
    if request.method == "POST":
        # Frontend sends code_verifier in body
        try:
            body = await request.json()
            code_verifier = body.get("code_verifier")
        except Exception:
            pass
    
    # If not in body, try to get from cookies (backend-generated PKCE flow)
    if not code_verifier:
        # Validate state cookie exists and matches
        cookie_state = request.cookies.get("auth_state")
        if cookie_state and cookie_state == state:
            pkce_name = _pkce_cookie_name(state)
            code_verifier = request.cookies.get(pkce_name)
    
    # If still no code_verifier and PKCE is required, raise error
    if settings.cognito_use_pkce and not code_verifier:
        raise AuthenticationError("Missing PKCE verifier. Please ensure you're using the correct authentication flow.")

    try:
        tokens = await service.exchange_code_for_tokens(code=code, code_verifier=code_verifier)
    except EBSException as exc:
        raise AuthenticationError("Failed to exchange authorization code") from exc

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")

    if not access_token:
        raise AuthenticationError("No access_token returned from Cognito")

    # Decode token to determine user role and decide redirect target
    try:
        public_key = await get_rsa_key(access_token)
        payload = jwt.decode(
            access_token,
            public_key,
            algorithms=["RS256"],
            audience=None,
            issuer=settings.cognito_issuer,
            options={"verify_signature": True, "verify_aud": False, "verify_exp": True},
        )
    except (InvalidTokenError, DecodeError, Exception):
        # Token invalid or cannot be decoded — deny access
        frontend_base_url = settings.cognito_redirect_uri.rsplit("/auth/callback", 1)[0] if settings.cognito_redirect_uri else "http://localhost:5173"
        return RedirectResponse(url=f"{frontend_base_url}/unauthorized", status_code=status.HTTP_302_FOUND)

    role = get_user_role(payload)
    
    # Determine frontend redirect target based on role
    # Use frontend routes (not backend routes)
    if role == UserRole.STUDENT:
        target = "/dashboard"  # Frontend route
    elif role == UserRole.COORDINATOR:
        target = "/dashboard"  # Frontend route
    elif role == UserRole.ADMIN:
        target = "/admin"  # Frontend route
    else:
        target = "/unauthorized"  # Frontend route
    
    # Get frontend URL from redirect URI (remove /auth/callback)
    # cognito_redirect_uri is typically: http://localhost:5173/auth/callback
    # We need: http://localhost:5173
    frontend_base_url = settings.cognito_redirect_uri.rsplit("/auth/callback", 1)[0] if settings.cognito_redirect_uri else "http://localhost:5173"
    frontend_url = f"{frontend_base_url}{target}"
    
    # If request is POST (from frontend with code_verifier), return JSON instead of redirect
    if request.method == "POST":
        response = JSONResponse({
            "status": "success",
            "redirect_url": frontend_url,
            "user": {
                "sub": payload.get("sub"),
                "email": payload.get("email"),
                "role": role.value if role else "UNKNOWN",
            }
        })
    else:
        # GET request (direct redirect from Cognito), use redirect response
        response = RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)

    # Set auth cookies (HTTP-only) - works for both JSONResponse and RedirectResponse
    
    # Determine cookie security settings
    is_secure = settings.cookie_secure
    if settings.is_development:
        is_secure = False

    if refresh_token:
        response.set_cookie(
            "refresh_token",
            refresh_token,
            max_age=settings.cookie_refresh_max_age,
            httponly=True,
            secure=is_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )

    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.cookie_access_max_age,
        httponly=True,
        secure=is_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )

    id_token = tokens.get("id_token")
    if id_token:
        response.set_cookie(
            "id_token",
            id_token,
            max_age=settings.cookie_access_max_age,
            httponly=True,
            secure=is_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )

    # Clear PKCE and state cookies (only if they exist - might not exist if using frontend PKCE)
    if request.cookies.get("auth_state"):
        response.delete_cookie("auth_state", domain=settings.cookie_domain)
    pkce_name = _pkce_cookie_name(state)
    if request.cookies.get(pkce_name):
        response.delete_cookie(pkce_name, domain=settings.cookie_domain)
    if request.cookies.get("auth_nonce"):
        response.delete_cookie("auth_nonce", domain=settings.cookie_domain)

    return response


@router.post("/refresh")
async def refresh(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise AuthenticationError("Missing refresh token cookie")

    try:
        tokens = await service.refresh_tokens(refresh_token=refresh_token)
    except EBSException as e:
        raise e

    access_token = tokens.get("access_token")
    if not access_token:
        raise AuthenticationError("No access token returned from refresh")

    response = JSONResponse({"status": "ok"})
    
    # Determine cookie security settings
    is_secure = settings.cookie_secure
    if settings.is_development:
        is_secure = False
    
    # Update access_token cookie
    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.cookie_access_max_age,
        httponly=True,
        secure=is_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )
    
    # Update id_token if present (Cognito returns it on refresh)
    id_token = tokens.get("id_token")
    if id_token:
        response.set_cookie(
            "id_token",
            id_token,
            max_age=settings.cookie_access_max_age,
            httponly=True,
            secure=is_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )

    return response


@router.post("/logout")
async def logout(request: Request):
    # Clear cookies
    response = JSONResponse({"status": "logged_out"})
    
    # Determine cookie security settings to match creation
    is_secure = settings.cookie_secure
    if settings.is_development:
        is_secure = False
    
    # Prepare cookie deletion parameters
    # When cookie_domain is None, don't pass it to delete_cookie (FastAPI handles it better)
    cookie_params = {
        "path": "/",
        "httponly": True,
        "secure": is_secure,
        "samesite": settings.cookie_samesite,
    }
    
    # Only add domain if it's not None
    if settings.cookie_domain:
        cookie_params["domain"] = settings.cookie_domain
    
    # Delete standard auth cookies with exact same attributes as creation
    # Note: max_age=0 is automatically set by delete_cookie
    response.delete_cookie("access_token", **cookie_params)
    response.delete_cookie("refresh_token", **cookie_params)
    response.delete_cookie("auth_state", **cookie_params)
    response.delete_cookie("id_token", **cookie_params)
    response.delete_cookie("auth_nonce", **cookie_params)
    
    # Delete all PKCE cookies dynamically (they have names like pkce_<state>)
    # Iterate over all cookies to find and delete PKCE cookies
    for cookie_name in request.cookies.keys():
        if cookie_name.startswith("pkce_"):
            response.delete_cookie(cookie_name, **cookie_params)
        
    return response


@router.get("/tokens")
async def get_tokens(request: Request):
    """Optional endpoint to get current tokens from cookies for frontend that needs them."""
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    id_token = request.cookies.get("id_token")
    
    if not access_token:
        raise AuthenticationError("No access token found in cookies")
    
    # Decode token to get user info
    try:
        public_key = await get_rsa_key(access_token)
        payload = jwt.decode(
            access_token,
            public_key,
            algorithms=["RS256"],
            audience=None,
            issuer=settings.cognito_issuer,
            options={"verify_signature": True, "verify_aud": False, "verify_exp": True},
        )
    except (InvalidTokenError, DecodeError, Exception):
        raise AuthenticationError("Invalid access token")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "id_token": id_token,
        "user_info": {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "cognito:groups": payload.get("cognito:groups", []),
            "exp": payload.get("exp"),
        }
    }


@router.post("/set-tokens")
<<<<<<< HEAD
async def set_tokens(request: Request, tokens: SetTokensRequest = Body(...)):
    """Receive tokens from frontend and set them as HTTP-only cookies.
    
    This endpoint is used when the frontend authenticates directly with Cognito
    and needs to send the tokens to the backend to establish a session.
    """
    access_token = tokens.access_token
    refresh_token = tokens.refresh_token
    id_token = tokens.id_token
    
    # Validate access token
    try:
        public_key = await get_rsa_key(access_token)
        payload = jwt.decode(
            access_token,
            public_key,
            algorithms=["RS256"],
            audience=None,
            issuer=settings.cognito_issuer,
            options={"verify_signature": True, "verify_aud": False, "verify_exp": True},
        )
    except (InvalidTokenError, DecodeError) as e:
        raise AuthenticationError(f"Invalid access token: {str(e)}")
    except Exception as e:
        raise AuthenticationError(f"Error validating token: {str(e)}")
    
    # Optionally validate id_token (same user, same issuer)
    try:
        id_public_key = await get_rsa_key(id_token)
        id_payload = jwt.decode(
            id_token,
            id_public_key,
            algorithms=["RS256"],
            audience=settings.cognito_client_id,
            issuer=settings.cognito_issuer,
            options={"verify_signature": True, "verify_aud": True, "verify_exp": True},
        )
        # Verify that both tokens belong to the same user
        if id_payload.get("sub") != payload.get("sub"):
            raise AuthenticationError("Token user mismatch")
    except (InvalidTokenError, DecodeError) as e:
        # ID token validation is optional but recommended
        # Log warning but don't fail the request
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"ID token validation failed: {str(e)}")
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Error validating ID token: {str(e)}")
    
    # Get user role from token
    role = get_user_role(payload)
    
    # Create response with user profile
    response = JSONResponse({
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "role": role.value if role else "UNKNOWN",
        "groups": payload.get("cognito:groups", []),
        "exp": payload.get("exp"),
    })
    
    # Set HTTP-only cookies
    if refresh_token:
        response.set_cookie(
            "refresh_token",
            refresh_token,
            max_age=settings.cookie_refresh_max_age,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )
    
    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.cookie_access_max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )
    
    if id_token:
        response.set_cookie(
            "id_token",
            id_token,
            max_age=settings.cookie_access_max_age,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )
    
    return response


@router.get("/profile")
async def get_profile(request: Request):
    """Get current user profile from access token."""
    access_token = request.cookies.get("access_token")
=======
async def set_tokens(request: Request):
    """Set authentication tokens as HTTP-only cookies from request body.
    Used when frontend authenticates directly with Cognito (e.g., NEW_PASSWORD_REQUIRED flow).
>>>>>>> 50bb6094d50d71301466789ca430ba62ffdca6f9
    
    WARNING: This endpoint is a security risk and should only be used in development.
    In production, tokens should only be set via the /callback endpoint.
    """
    if settings.is_production:
        raise AuthenticationError("This endpoint is not available in production")
    
    try:
        body = await request.json()
        access_token = body.get("access_token")
        refresh_token = body.get("refresh_token")
        id_token = body.get("id_token")
        
        if not access_token:
            raise AuthenticationError("Missing access_token in request body")
        
        # Validate access token by decoding it
        try:
            public_key = await get_rsa_key(access_token)
            payload = jwt.decode(
                access_token,
                public_key,
                algorithms=["RS256"],
                audience=None,
                issuer=settings.cognito_issuer,
                options={"verify_signature": True, "verify_aud": False, "verify_exp": True},
            )
        except (InvalidTokenError, DecodeError, Exception):
            raise AuthenticationError("Invalid access token")
        
        role = get_user_role(payload)
        
        # Set cookies
        response = JSONResponse({
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "role": role.value if role else "UNKNOWN",
            "groups": payload.get("cognito:groups", []),
        })
        
        # Determine cookie security settings
        is_secure = settings.cookie_secure
        if settings.is_development:
            is_secure = False
        
        if refresh_token:
            response.set_cookie(
                "refresh_token",
                refresh_token,
                max_age=settings.cookie_refresh_max_age,
                httponly=True,
                secure=is_secure,
                samesite=settings.cookie_samesite,
                domain=settings.cookie_domain,
            )
        
        response.set_cookie(
            "access_token",
            access_token,
            max_age=settings.cookie_access_max_age,
            httponly=True,
            secure=is_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )
        
        if id_token:
            response.set_cookie(
                "id_token",
                id_token,
                max_age=settings.cookie_access_max_age,
                httponly=True,
                secure=is_secure,
                samesite=settings.cookie_samesite,
                domain=settings.cookie_domain,
            )
        
        return response
    except Exception as e:
        if isinstance(e, AuthenticationError):
            raise
        raise AuthenticationError(f"Failed to set tokens: {str(e)}")




__all__ = ["router"]
