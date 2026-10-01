.PHONY: help setup dev api bot worker web dev-web up down test lint format types typecheck seed festival-seed i18n-warm ocr-eval clean

help:
	@echo "VYOM — AI Business Partner for Paytm Merchants"
	@echo "Available commands:"
	@echo "  make setup         - Install all Python and Node dependencies"
	@echo "  make dev / api     - Run backend API server locally (uvicorn)"
	@echo "  make web / dev-web - Run frontend Next.js dev server"
	@echo "  make worker        - Run background worker scheduler"
	@echo "  make up            - Boot full stack in Docker (mongo replica set, api, worker, web)"
	@echo "  make down          - Stop and remove Docker containers"
	@echo "  make test          - Run pytest test suite"
	@echo "  make lint          - Run ruff linter check"
	@echo "  make types         - Run mypy strict type checker"
	@echo "  make seed          - Seed store, customers, transactions, and catalog"
	@echo "  make festival-seed - Seed festival calendar and cultural playbooks"

setup:
	uv sync
	cd apps/web && pnpm install

api: dev

bot:
	uv run --project apps/api python -m vyom.bot.app

dev:
	uv run uvicorn vyom.main:app --reload --host 0.0.0.0 --port 8000

worker:
	uv run python -m vyom.worker.scheduler

web: dev-web

dev-web:
	cd apps/web && pnpm dev

up:
	docker compose up -d --build

down:
	docker compose down -v

test:
	uv run pytest tests/ -v

lint:
	uv run ruff check .

format:
	uv run ruff format .

typecheck:
	uv run mypy apps/api/src tests

seed:
	uv run python -m vyom.scripts.seed

festival-seed:
	uv run python -m vyom.scripts.festival_seed

i18n-warm:
	uv run python -m vyom.scripts.i18n_warm

ocr-eval:
	uv run python -m vyom.scripts.ocr_eval

clean:
	rm -rf .pytest_cache .ruff_cache __pycache__ apps/api/src/vyom/__pycache__
