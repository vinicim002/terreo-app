"""API do Térreo. Na Etapa 1 só existe a verificação de saúde (contracts/api.md)."""

import asyncio
import logging
from collections.abc import Awaitable, Callable

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy import text

from app.config import get_settings
from app.db import get_engine

logger = logging.getLogger("terreo.api")

CHECK_TIMEOUT_SECONDS = 2.0


async def check_database() -> None:
    async with get_engine().connect() as conn:
        await conn.execute(text("SELECT 1"))


async def check_redis() -> None:
    client = Redis.from_url(get_settings().redis_url)
    try:
        await client.ping()
    finally:
        await client.aclose()


async def _run_check(name: str, check: Callable[[], Awaitable[None]]) -> str:
    try:
        await asyncio.wait_for(check(), timeout=CHECK_TIMEOUT_SECONDS)
        return "ok"
    except Exception:
        # O detalhe vai só para o log do servidor, nunca para a resposta.
        logger.exception("Verificação de saúde falhou: %s", name)
        return "error"


def create_app(env: str | None = None) -> FastAPI:
    settings = get_settings()
    is_dev = (env or settings.app_env) == "development"
    app = FastAPI(
        title="Térreo API",
        version=settings.app_version,
        docs_url="/docs" if is_dev else None,
        redoc_url=None,
        openapi_url="/openapi.json" if is_dev else None,
    )

    @app.get("/api/health")
    async def health() -> JSONResponse:
        # Busca as funções no módulo a cada chamada para que os testes possam substituí-las.
        import app.main as module

        database, redis = await asyncio.gather(
            _run_check("database", module.check_database),
            _run_check("redis", module.check_redis),
        )
        checks = {"database": database, "redis": redis}
        healthy = all(value == "ok" for value in checks.values())
        return JSONResponse(
            status_code=200 if healthy else 503,
            content={
                "status": "ok" if healthy else "degraded",
                "version": settings.app_version,
                "checks": checks,
            },
        )

    return app


app = create_app()
