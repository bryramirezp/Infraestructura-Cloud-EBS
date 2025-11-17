## Plan: AWS Cognito Auth Flow (PKCE + HTTP-only cookies + async httpx)

This plan updates the previous draft to explicitly use server-set HTTP-only cookies (recommended for security) and PKCE (required for a React SPA). We'll implement the OAuth pieces as a focused async service using `httpx`, and keep `backend/app/utils/jwt_auth.py` as the JWT/JWKS verification and FastAPI dependency module.

### Design summary
- Token verification and FastAPI DI (bearer token checks) remain in `backend/app/utils/jwt_auth.py` (single responsibility, unchanged except for using new settings as needed).
- OAuth2 authorization flow (authorize URL, token exchange, refresh, userinfo) lives in `backend/app/services/cognito_service.py` implemented with async `httpx`.
- Routing for login/callback/refresh/logout lives in `backend/app/routes/auth_routes.py` and is registered in `backend/app/main.py` under a clear prefix (e.g., `/auth`).
- PKCE: the server generates `code_verifier` and `code_challenge` during `/auth/login` and keeps the `code_verifier` secret by storing it in an HTTP-only, Secure cookie tied to a `state` value.
- After successful token exchange, the backend sets HTTP-only, Secure cookies for `refresh_token` (long-lived) and a short-lived `access_token`. The SPA does not directly access these cookies; API requests from the SPA send cookies automatically.

### Steps (detailed)
1. ✅ Update configuration (`backend/app/config.py`)
  - Added new settings: `cognito_domain`, `cognito_client_id`, `cognito_client_secret` (optional), `cognito_redirect_uri`, `cognito_scopes` (default `openid profile email`), `cognito_use_pkce` (bool=true), and cookie behavior settings: `cookie_domain`, `cookie_secure`, `cookie_samesite`, `cookie_access_max_age`, `cookie_refresh_max_age`.

2. ✅ Create async service `backend/app/services/cognito_service.py`
  - Implemented `CognitoService` with async methods using `httpx.AsyncClient`:
    - `build_authorization_url(state: str, nonce: str) -> tuple[str, str]` — generate `code_verifier` and `code_challenge`, return the authorize URL and the `code_verifier` (caller stores verifier in an HTTP-only cookie keyed by `state`).
    - `exchange_code_for_tokens(code: str, code_verifier: str) -> dict` — POST to `https://{cognito_domain}/oauth2/token` with `grant_type=authorization_code`, `client_id`, `redirect_uri`, `code`, and `code_verifier`.
    - `refresh_tokens(refresh_token: str) -> dict` — POST to `/oauth2/token` with `grant_type=refresh_token`.
    - `get_userinfo(access_token: str) -> dict` — GET to `/oauth2/userInfo` with Authorization header.
  - Map HTTP errors to `EBSException` with helpful messages.

3. ✅ Add auth routes `backend/app/routes/auth_routes.py`
  - `GET /auth/login` generates `state`/`nonce`, builds authorize URL via `CognitoService`, stores `code_verifier` and `state` in HTTP-only Secure cookies, and redirects to Cognito.
  - `GET /auth/callback` validates `state`, exchanges `code` for tokens, sets `access_token` and `refresh_token` cookies, fetches user info, and clears PKCE cookies.
  - `POST /auth/refresh` reads the refresh token cookie, refreshes tokens, and updates the access token cookie.
  - `POST /auth/logout` clears auth-related cookies.

4. ✅ Register router in `backend/app/main.py` and ensure CORS allows SPA origin and `allow_credentials=True` so cookies are sent.

5. ✅ Update `backend/requirements.txt` and testing deps
  - Added `httpx`, `respx`, and additional OAuth helpers (`Flask`, `Werkzeug`, `authlib`) alongside existing crypto dependencies.

6. ⏳ Tests and docs
  - Pending: add unit tests for `CognitoService` using `respx`/`pytest-httpx` to mock token and userinfo endpoints.
  - Pending: update README with required env vars and example flows for SPA.

### Env variables (required)
- `COGNITO_DOMAIN` (e.g. `your-domain.auth.region.amazoncognito.com`)
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET` (optional for confidential clients)
- `COGNITO_REDIRECT_URI` (backend callback URL)
- `COGNITO_SCOPES` (default `openid profile email`)
- `COGNITO_USE_PKCE` = true
- Cookie behavior: `COOKIE_DOMAIN`, `COOKIE_SECURE` (true/false), `COOKIE_SAMESITE` (Lax/Strict), `COOKIE_ACCESS_MAX_AGE`, `COOKIE_REFRESH_MAX_AGE`

### Implementation notes (PKCE + server-side cookies)
- During `/auth/login` the server generates `code_verifier` and `code_challenge`, stores the verifier in an HTTP-only Secure cookie tied to `state`, and redirects to Cognito with `code_challenge` and `state`.
- On `/auth/callback` the server reads the `code_verifier` cookie to call the token endpoint and then sets cookies for `refresh_token` and `access_token`.
- The SPA never receives tokens in JS; it relies on cookies and can call an endpoint like `/auth/me` to obtain the currently authenticated user (server reads `access_token` cookie and calls `get_userinfo` or validates JWT via `jwt_auth.py`).

### Security considerations (summary)
- PKCE is mandatory for public SPAs.
- Use HTTP-only Secure cookies for refresh tokens and short-lived access tokens.
- Enforce `state` and `nonce` checks.
- Rotate refresh tokens and limit cookie lifetimes.

---

Next steps I can implement for you:
1. Add tests for `CognitoService` (with `respx`) and document required env vars.

Tell me which step to implement next and I will continue.