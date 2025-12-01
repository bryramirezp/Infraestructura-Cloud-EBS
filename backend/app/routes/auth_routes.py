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
async def login():
    """Start the OAuth2 PKCE flow by redirecting to Cognito hosted UI."""
    state = secrets.token_urlsafe(16)
    nonce = secrets.token_urlsafe(16)
    authorize_url, code_verifier = await service.build_authorization_url(state=state, nonce=nonce)

    response = RedirectResponse(authorize_url, status_code=status.HTTP_302_FOUND)

    # Store PKCE verifier tied to state in an HTTP-only cookie
    response.set_cookie(
        _pkce_cookie_name(state),
        code_verifier,
        max_age=300,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )

    # Also store a state cookie (HTTP-only) to validate callback
    response.set_cookie(
        "auth_state",
        state,
        max_age=300,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )

    return response


@router.get("/callback")
async def callback(request: Request):
    """Handle OAuth2 callback: exchange code for tokens and set auth cookies."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code or not state:
        raise AuthenticationError("Missing code or state in callback")

    # Validate state cookie exists and matches
    cookie_state = request.cookies.get("auth_state")
    if not cookie_state or cookie_state != state:
        raise AuthenticationError("Invalid or missing state cookie")

    pkce_name = _pkce_cookie_name(state)
    code_verifier = request.cookies.get(pkce_name)
    if settings.cognito_use_pkce and not code_verifier:
        raise AuthenticationError("Missing PKCE verifier cookie")

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
        return RedirectResponse(url="/unauthorized", status_code=status.HTTP_302_FOUND)

    role = get_user_role(payload)
    if role == UserRole.STUDENT:
        target = "/StudentDashboard"
    elif role == UserRole.COORDINATOR:
        target = "/CoordinatorDashboard"
    elif role == UserRole.ADMIN:
        target = "/AdminDashboard"
    else:
        target = "/unauthorized"

    redirect_response = RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)

    # Set auth cookies (HTTP-only)
    if refresh_token:
        redirect_response.set_cookie(
            "refresh_token",
            refresh_token,
            max_age=settings.cookie_refresh_max_age,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )

    redirect_response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.cookie_access_max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )

    id_token = tokens.get("id_token")
    if id_token:
        redirect_response.set_cookie(
            "id_token",
            id_token,
            max_age=settings.cookie_access_max_age,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            domain=settings.cookie_domain,
        )

    # Clear PKCE and state cookies
    redirect_response.delete_cookie(pkce_name, domain=settings.cookie_domain)
    redirect_response.delete_cookie("auth_state", domain=settings.cookie_domain)

    return redirect_response


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
    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.cookie_access_max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
    )

    return response


@router.post("/logout")
async def logout(request: Request):
    # Clear cookies
    response = JSONResponse({"status": "logged_out"})
    response.delete_cookie("access_token", domain=settings.cookie_domain)
    response.delete_cookie("refresh_token", domain=settings.cookie_domain)
    response.delete_cookie("auth_state", domain=settings.cookie_domain)
    # Optionally clear any PKCE cookie(s) — best-effort: prefix-based deletion is not possible here
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
    
    role = get_user_role(payload)
    
    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "role": role.value if role else "UNKNOWN",
        "groups": payload.get("cognito:groups", []),
        "exp": payload.get("exp"),
    }


__all__ = ["router"]
