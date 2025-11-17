from typing import Optional, Dict, Any
import secrets
import hashlib
import base64
import httpx

from app.config import settings
from app.utils.exceptions import EBSException


def _generate_code_verifier(length: int = 64) -> str:
    # RFC7636 recommends between 43 and 128 characters
    return secrets.token_urlsafe(length)[:128]


def _code_challenge_from_verifier(verifier: str) -> str:
    m = hashlib.sha256(verifier.encode("utf-8")).digest()
    challenge = base64.urlsafe_b64encode(m).decode("utf-8").rstrip("=")
    return challenge


class CognitoService:
    """Async helper for Cognito OAuth2 (PKCE-capable).

    Responsibilities:
    - Build authorize URL with PKCE parameters
    - Exchange code for tokens
    - Refresh tokens
    - Fetch userinfo
    """

    def __init__(self, *, timeout: int = 10):
        self.settings = settings
        self.timeout = timeout

    async def build_authorization_url(self, state: str, nonce: str) -> tuple[str, str]:
        """Return (authorize_url, code_verifier).

        Caller must store the returned `code_verifier` securely (HTTP-only cookie
        keyed by `state`) and later provide it to `exchange_code_for_tokens`.
        """
        code_verifier = _generate_code_verifier()
        params = {
            "response_type": "code",
            "client_id": self.settings.cognito_client_id,
            "redirect_uri": self.settings.cognito_redirect_uri,
            "scope": self.settings.cognito_scopes,
            "state": state,
            "nonce": nonce,
        }

        if self.settings.cognito_use_pkce:
            params["code_challenge_method"] = "S256"
            params["code_challenge"] = _code_challenge_from_verifier(code_verifier)

        # Build query string safely
        from urllib.parse import urlencode

        query = urlencode(params)
        url = f"{self.settings.cognito_authorize_url}?{query}"
        return url, code_verifier

    async def exchange_code_for_tokens(self, code: str, code_verifier: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "grant_type": "authorization_code",
            "client_id": self.settings.cognito_client_id,
            "code": code,
            "redirect_uri": self.settings.cognito_redirect_uri,
        }
        if self.settings.cognito_use_pkce and code_verifier:
            data["code_verifier"] = code_verifier

        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        auth: Optional[str] = None
        if self.settings.cognito_client_secret:
            import base64 as _b64

            creds = f"{self.settings.cognito_client_id}:{self.settings.cognito_client_secret}"
            auth = _b64.b64encode(creds.encode()).decode()
            headers["Authorization"] = f"Basic {auth}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.settings.cognito_token_url, data=data, headers=headers)

        if resp.status_code != 200:
            try:
                err = resp.json()
            except Exception:
                err = {"status_text": resp.text}
            raise EBSException(status_code=resp.status_code, detail=f"Token exchange failed: {err}")

        return resp.json()

    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        data = {
            "grant_type": "refresh_token",
            "client_id": self.settings.cognito_client_id,
            "refresh_token": refresh_token,
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        if self.settings.cognito_client_secret:
            import base64 as _b64

            creds = f"{self.settings.cognito_client_id}:{self.settings.cognito_client_secret}"
            headers["Authorization"] = f"Basic {_b64.b64encode(creds.encode()).decode()}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.settings.cognito_token_url, data=data, headers=headers)

        if resp.status_code != 200:
            try:
                err = resp.json()
            except Exception:
                err = {"status_text": resp.text}
            raise EBSException(status_code=resp.status_code, detail=f"Refresh token failed: {err}")

        return resp.json()

    async def get_userinfo(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.settings.cognito_userinfo_url, headers=headers)

        if resp.status_code != 200:
            try:
                err = resp.json()
            except Exception:
                err = {"status_text": resp.text}
            raise EBSException(status_code=resp.status_code, detail=f"Userinfo fetch failed: {err}")

        return resp.json()


__all__ = ["CognitoService"]
