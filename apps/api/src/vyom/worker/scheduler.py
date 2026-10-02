"""AsyncIOScheduler service for automated opportunity refreshes, udhaar sweeps, and campaign dispatch."""

from __future__ import annotations

import asyncio
from typing import Any

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from vyom.config import get_settings
from vyom.db import close_mongo, get_db, init_mongo
from vyom.worker.jobs import (
    run_campaign_dispatch,
    run_nightly_opportunity_detection,
    run_udhaar_reminder_sweep,
    send_10min_customer_payment_reminders,
)

logger = structlog.get_logger()


class VyomWorker:
    """Worker service hosting background schedules and triggers."""

    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
        self._is_running = False

    def setup_schedules(self, demo_mode: bool = True) -> None:
        """Register cron and interval triggers for all merchant business automations."""
        if demo_mode:
            # Frequent intervals in demo mode for instant demonstration
            self.scheduler.add_job(
                self._wrap_job(run_nightly_opportunity_detection),
                trigger=IntervalTrigger(minutes=15),
                id="opportunity_refresh_demo",
                name="Opportunity Refresh (Demo)",
                replace_existing=True,
            )
            self.scheduler.add_job(
                self._wrap_job(run_udhaar_reminder_sweep),
                trigger=IntervalTrigger(minutes=20),
                id="udhaar_sweep_demo",
                name="Udhaar Sweep (Demo)",
                replace_existing=True,
            )
            # self.scheduler.add_job(
            #     self._wrap_job(send_10min_customer_payment_reminders),
            #     trigger=IntervalTrigger(minutes=10),
            #     id="customer_10min_reminders_demo",
            #     name="Customer 10-Minute Payment Reminders (Demo)",
            #     replace_existing=True,
            # )
            self.scheduler.add_job(
                self._wrap_job(run_campaign_dispatch),
                trigger=IntervalTrigger(seconds=30),
                id="campaign_dispatch",
                name="Campaign Dispatch",
                replace_existing=True,
            )
        else:
            # Production schedules
            self.scheduler.add_job(
                self._wrap_job(run_nightly_opportunity_detection),
                trigger=CronTrigger(hour=1, minute=0, timezone="Asia/Kolkata"),
                id="opportunity_refresh_nightly",
                name="Opportunity Refresh Nightly",
                replace_existing=True,
            )
            self.scheduler.add_job(
                self._wrap_job(run_udhaar_reminder_sweep),
                trigger=CronTrigger(hour=10, minute=30, timezone="Asia/Kolkata"),
                id="udhaar_sweep_morning",
                name="Udhaar Sweep Morning",
                replace_existing=True,
            )
            # self.scheduler.add_job(
            #     self._wrap_job(send_10min_customer_payment_reminders),
            #     trigger=IntervalTrigger(minutes=10),
            #     id="customer_10min_reminders",
            #     name="Customer 10-Minute Payment Reminders",
            #     replace_existing=True,
            # )
            self.scheduler.add_job(
                self._wrap_job(run_campaign_dispatch),
                trigger=IntervalTrigger(minutes=5),
                id="campaign_dispatch",
                name="Campaign Dispatch",
                replace_existing=True,
            )

        logger.info("worker_schedules_configured", demo_mode=demo_mode)

    def _wrap_job(self, coro_func: Any) -> Any:
        """Wrapper ensuring DB connection availability and exception logging."""
        async def wrapped() -> None:
            db = get_db()
            try:
                await coro_func(db)
            except Exception as exc:
                logger.error("scheduled_job_failed", job=coro_func.__name__, error=str(exc))
        return wrapped

    def start(self) -> None:
        """Start the scheduler background thread/loop."""
        if not self._is_running:
            self.scheduler.start()
            self._is_running = True
            logger.info("vyom_scheduler_started")

    def stop(self) -> None:
        """Shutdown the scheduler."""
        if self._is_running:
            self.scheduler.shutdown(wait=False)
            self._is_running = False
            logger.info("vyom_scheduler_stopped")


# Global worker instance
worker = VyomWorker()


async def run_worker() -> None:
    """Standalone worker process entrypoint for Docker container."""
    settings = get_settings()
    logger.info("starting_vyom_worker_process")

    await init_mongo(settings)
    worker.setup_schedules(demo_mode=settings.demo_mode)
    worker.start()

    try:
        while True:
            await asyncio.sleep(3600)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        worker.stop()
        await close_mongo()
        logger.info("vyom_worker_process_terminated")


if __name__ == "__main__":
    asyncio.run(run_worker())
