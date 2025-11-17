import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture()
def client() -> TestClient:
    """Provide a FastAPI test client for the application."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["environment"] == settings.environment
    assert payload["version"] == "1.0.0"


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "EBS API"
    assert payload["version"] == "1.0.0"
    expected_docs_value = "/docs" if settings.is_development else "disabled"
    assert payload["docs"] == expected_docs_value


def test_not_found_uses_custom_handler(client: TestClient) -> None:
    response = client.get("/does-not-exist")
    assert response.status_code == 404
    payload = response.json()
    assert payload["status_code"] == 404
    assert payload["path"] == "/does-not-exist"
    assert payload["error"] == "Not Found"
