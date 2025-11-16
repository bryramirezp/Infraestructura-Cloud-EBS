## Plan: AWS Cognito Auth Flow (PKCE + HTTP-only cookies + async httpx)

This plan updates the previous draft to explicitly use server-set HTTP-only cookies (recommended for security) and PKCE (required for a React SPA). We'll implement the OAuth pieces as a focused async service using `httpx`, and keep `backend/app/utils/auth.py` as the JWT/JWKS verification and FastAPI dependency module.

### Design summary
- Token verification and FastAPI DI (bearer token checks) remain in `backend/app/utils/auth.py` (single responsibility, unchanged except for using new settings as needed).
- OAuth2 authorization flow (authorize URL, token exchange, refresh, userinfo) will live in `backend/app/services/cognito_service.py` implemented with async `httpx`.
- Routing for login/callback/refresh/logout will live in `backend/app/routes/auth.py` and will be registered in `backend/app/main.py` under a clear prefix (e.g., `/auth`).
- PKCE: the server will generate `code_verifier` and `code_challenge` during `/auth/login` and keep the `code_verifier` secret by storing it in an HTTP-only, Secure cookie tied to a `state` value.
- After successful token exchange, the backend sets HTTP-only, Secure cookies for `refresh_token` (long-lived) and a short-lived `access_token` (or session cookie). The SPA will not directly access these cookies; API requests from the SPA will send cookies automatically.

### Steps (detailed)
1. Update configuration (`backend/app/config.py`)
   - Add new settings: `cognito_domain`, `cognito_client_id`, `cognito_client_secret` (optional), `cognito_redirect_uri`, `cognito_scopes` (default `openid profile email`), `cognito_use_pkce` (bool=true), and cookie behavior settings: `cookie_domain`, `cookie_secure`, `cookie_samesite`, `cookie_access_max_age`, `cookie_refresh_max_age`.

2. Create async service `backend/app/services/cognito_service.py` (new)
   - Implement `CognitoService` with async methods using `httpx.AsyncClient`:
     - `build_authorization_url(state: str, nonce: str) -> tuple[str, str]` — generate `code_verifier` and `code_challenge`, return the authorize URL and the `code_verifier` (the caller will store `code_verifier` in an HTTP-only cookie keyed by `state`).
     - `exchange_code_for_tokens(code: str, code_verifier: str) -> dict` — POST to `https://{cognito_domain}/oauth2/token` with `grant_type=authorization_code`, `client_id`, `redirect_uri`, `code`, and `code_verifier`.
     - `refresh_tokens(refresh_token: str) -> dict` — POST to `/oauth2/token` with `grant_type=refresh_token`.
     - `get_userinfo(access_token: str) -> dict` — GET to `/oauth2/userInfo` with Authorization header.
   - Map HTTP errors to `EBSException` or FastAPI `HTTPException` with helpful messages.

3. Add auth routes `backend/app/routes/auth.py` (new)
   - `GET /auth/login`:
     - Generate `state` and `nonce` (random, base64) and call `CognitoService.build_authorization_url`.
     - Store `state` and the returned `code_verifier` in short-lived HTTP-only Secure cookies (or server-side cache keyed by `state`).
     - Redirect the browser to the Cognito `authorize` URL.
   - `GET /auth/callback`:
     - Validate `state` against cookie value.
     - Read `code` from query params and `code_verifier` from HTTP-only cookie (or server-side store) and call `CognitoService.exchange_code_for_tokens`.
     - On success, set cookies:
       - `refresh_token` as HTTP-only, Secure cookie with `cookie_refresh_max_age`.
       - `access_token` as HTTP-only, Secure cookie with `cookie_access_max_age` (or use a signed session cookie).
     - Return a JSON payload with minimal user info (`sub`, `email`) and optionally redirect to SPA root URL.
   - `POST /auth/refresh`:
     - Read `refresh_token` from cookie and call `CognitoService.refresh_tokens`.
     - Update `access_token` cookie and return session info.
   - `POST /auth/logout`:
     - Clear auth cookies and optionally call Cognito `logout` endpoint to invalidate session.

4. Register router in `backend/app/main.py` and ensure CORS allows SPA origin and `allow_credentials=True` so cookies are sent.

5. Update `backend/requirements.txt` and tests
   - Add `httpx>=0.24.0` and `respx` (for testing/mocking httpx) and ensure `cryptography` is present for PKCE utilities if needed.

6. Tests and docs
   - Add unit tests for `CognitoService` using `respx`/`pytest-httpx` to mock token and userinfo endpoints.
   - Update README with required env vars and example flows for SPA.

### Env variables (required)
- `COGNITO_DOMAIN` (e.g. `your-domain.auth.region.amazoncognito.com`)
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET` (optional for confidential clients)
- `COGNITO_REDIRECT_URI` (backend callback URL)
- `COGNITO_SCOPES` (default `openid profile email`)
- `COGNITO_USE_PKCE` = true
- Cookie behavior: `COOKIE_DOMAIN`, `COOKIE_SECURE` (true/false), `COOKIE_SAMESITE` (Lax/Strict), `COOKIE_ACCESS_MAX_AGE`, `COOKIE_REFRESH_MAX_AGE`

### Implementation notes (PKCE + server-side cookies)
- During `/auth/login` the server will generate `code_verifier` and `code_challenge`, store `code_verifier` in an HTTP-only Secure cookie tied to `state`, and redirect to Cognito with `code_challenge` and `state`.
- On `/auth/callback` the server reads the `code_verifier` cookie to call the token endpoint and then sets cookies for `refresh_token` and `access_token`.
- The SPA never receives tokens in JS; it relies on cookies and can call an endpoint like `/auth/me` to obtain the currently authenticated user (server reads `access_token` cookie and calls `get_userinfo` or validates JWT via `auth.py`).

### Security considerations (summary)
- PKCE is mandatory for public SPAs.
- Use HTTP-only Secure cookies for refresh tokens and short-lived access tokens.
- Enforce `state` and `nonce` checks.
- Rotate refresh tokens and limit cookie lifetimes.

---

Next steps I can implement for you:
1. Create `backend/app/services/cognito_service.py` (async httpx) and `backend/app/routes/auth.py`, register them in `main.py`, and add required settings to `config.py`.
2. Update `backend/requirements.txt` to include `httpx` and `respx` (for tests), and add unit tests.

Tell me which step to implement first and I will create the code.