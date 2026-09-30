"""FastAPI application factory for VYOM Backend."""

from __future__ import annotations

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

    # 1. Connect to MongoDB
    try:
        db = await init_mongo(settings)
        # 2. Ensure indexes & migrations
        await ensure_indexes(db)
        await apply_migrations(db)
        logger.info("vyom_db_ready")
    except Exception as exc:
        logger.warning("vyom_db_init_warning", error=str(exc))

    yield

    # Shutdown
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

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.web_origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "*",  # Permissive for local demo development
        ],
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
