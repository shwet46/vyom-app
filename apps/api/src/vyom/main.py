"""FastAPI application factory for VYOM Backend."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from vyom.api.v1 import api_v1_router
from vyom.config import get_settings
from vyom.core.errors import AppError, app_error_handler, general_exception_handler
from vyom.db import close_mongo, init_mongo
from vyom.db.indexes import ensure_indexes
from vyom.db.migrations import apply_migrations

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle."""
    settings = get_settings()
    logger.info(
        "vyom_startup",
        env="development" if settings.debug else "production",
        demo_mode=settings.demo_mode,
    )

    reminder_task: asyncio.Task[None] | None = None
    polling_task: asyncio.Task[None] | None = None
    worker_running: bool = False

    # 1. Connect to MongoDB
    try:
        db = await init_mongo(settings)
        # 2. Ensure indexes & migrations
        await ensure_indexes(db)
        await apply_migrations(db)
        logger.info("vyom_db_ready")

        # 3. Start Telegram bot polling (if configured)
        if settings.bot_mode == "polling" and settings.telegram_bot_token.strip():
            from vyom.bot.app import create_bot_and_dispatcher

            async def _bot_polling_worker() -> None:
                """Run aiogram polling inside the same event loop as FastAPI."""
                try:
                    _bot, _dp = create_bot_and_dispatcher(settings)
                    await _bot.delete_webhook(drop_pending_updates=False)
                    logger.info(
                        "telegram_bot_polling_started",
                        username=settings.bot_username or "configured",
                    )
                    await _dp.start_polling(_bot, handle_signals=False)
                except asyncio.CancelledError:
                    logger.info("telegram_bot_polling_stopped")
                except Exception as poll_err:
                    logger.warning("telegram_bot_polling_error", error=str(poll_err))

            polling_task = asyncio.create_task(_bot_polling_worker())
            logger.info("telegram_bot_polling_task_scheduled")
        else:
            logger.info(
                "telegram_bot_polling_skipped",
                mode=settings.bot_mode,
                token_set=bool(settings.telegram_bot_token.strip()),
            )

        # 4. Start 10-minute payment reminder background task
        from vyom.worker.jobs import send_10min_customer_payment_reminders

        async def _periodic_10min_reminders_worker() -> None:
            logger.info("periodic_10min_payment_reminders_task_started", interval_minutes=10)
            try:
                while True:
                    await asyncio.sleep(600)  # 10 minutes
                    try:
                        sent = await send_10min_customer_payment_reminders(db)
                        logger.info("periodic_10min_payment_reminders_dispatched", sent=sent)
                    except Exception as loop_err:
                        logger.warning("periodic_10min_payment_reminders_cycle_error", error=str(loop_err))
            except asyncio.CancelledError:
                logger.info("periodic_10min_payment_reminders_task_stopped")

        # reminder_task = asyncio.create_task(_periodic_10min_reminders_worker())
        reminder_task = None

        # 5. Start background worker scheduler if enabled (useful for single-service deployments on Render)
        if settings.run_worker_in_api:
            from vyom.worker.scheduler import worker as bg_worker

            bg_worker.setup_schedules(demo_mode=settings.demo_mode)
            bg_worker.start()
            worker_running = True
            logger.info("in_process_worker_scheduler_started")
    except Exception as exc:
        logger.warning("vyom_db_init_warning", error=str(exc))

    yield

    # Shutdown
    if worker_running:
        try:
            from vyom.worker.scheduler import worker as bg_worker

            bg_worker.stop()
            logger.info("in_process_worker_scheduler_stopped")
        except Exception as stop_err:
            logger.warning("in_process_worker_scheduler_stop_error", error=str(stop_err))

    if polling_task:
        polling_task.cancel()
        try:
            await polling_task
        except asyncio.CancelledError:
            pass
    if reminder_task:
        reminder_task.cancel()
        try:
            await reminder_task
        except asyncio.CancelledError:
            pass
    await close_mongo()
    logger.info("vyom_shutdown")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="VYOM API",
        description="AI Business Partner for Paytm Merchants",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS configuration - supports comma-separated list of origins
    allowed_origins = [o.strip() for o in settings.web_origin.split(",") if o.strip()]
    for fallback_origin in ("http://localhost:3000", "http://127.0.0.1:3000"):
        if fallback_origin not in allowed_origins:
            allowed_origins.append(fallback_origin)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, general_exception_handler)

    @app.get("/healthz", tags=["Health"])
    async def healthz() -> dict[str, str]:
        """Liveness check."""
        return {"status": "ok", "app": "vyom", "version": "0.1.0"}

    @app.get("/readyz", tags=["Health"])
    async def readyz() -> JSONResponse:
        """Readiness probe checking MongoDB connection."""
        try:
            from vyom.db import get_client

            client = get_client()
            await client.admin.command("ping")
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"status": "ready", "database": "connected"},
            )
        except Exception as exc:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "not_ready", "error": str(exc)},
            )

    # Mount API v1
    app.include_router(api_v1_router, prefix="/api/v1")

    return app


app = create_app()
