"""GET /api/health — contracts/api.md."""

import pytest
from httpx import ASGITransport, AsyncClient

from app import main


@pytest.fixture
async def client():
    transport = ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def _ok() -> None:
    return None


async def _fail() -> None:
    raise ConnectionError("db:5432 recusou a conexão com senha terreo-dev")


async def test_health_ok(client, monkeypatch):
    monkeypatch.setattr(main, "check_database", _ok)
    monkeypatch.setattr(main, "check_redis", _ok)

    response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "version": "0.1.0",
        "checks": {"database": "ok", "redis": "ok"},
    }


async def test_health_degraded_sem_detalhes_internos(client, monkeypatch):
    monkeypatch.setattr(main, "check_database", _ok)
    monkeypatch.setattr(main, "check_redis", _fail)

    response = await client.get("/api/health")

    assert response.status_code == 503
    body = response.json()
    assert body == {
        "status": "degraded",
        "version": "0.1.0",
        "checks": {"database": "ok", "redis": "error"},
    }
    assert "terreo-dev" not in response.text
    assert "5432" not in response.text


async def test_health_tempo_limite(client, monkeypatch):
    import asyncio

    async def _lento() -> None:
        await asyncio.sleep(10)

    monkeypatch.setattr(main, "CHECK_TIMEOUT_SECONDS", 0.05)
    monkeypatch.setattr(main, "check_database", _lento)
    monkeypatch.setattr(main, "check_redis", _ok)

    response = await client.get("/api/health")

    assert response.status_code == 503
    assert response.json()["checks"]["database"] == "error"


async def test_docs_so_em_desenvolvimento():
    from app.main import create_app

    prod = create_app(env="production")
    transport = ASGITransport(app=prod)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        assert (await c.get("/docs")).status_code == 404
        assert (await c.get("/openapi.json")).status_code == 404
