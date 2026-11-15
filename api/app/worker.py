"""Worker ARQ. Na Etapa 1 só registra que subiu; as tarefas entram na Etapa 3."""

import logging

from arq.connections import RedisSettings

from app.config import get_settings

logger = logging.getLogger("terreo.worker")


async def startup(ctx: dict) -> None:
    logger.info("Worker do Térreo no ar.")


async def ping(ctx: dict) -> str:
    """Tarefa de verificação da fila (o ARQ exige ao menos uma tarefa registrada)."""
    return "pong"


class WorkerSettings:
    functions = [ping]
    on_startup = startup
    redis_settings = RedisSettings.from_dsn(get_settings().redis_url)
