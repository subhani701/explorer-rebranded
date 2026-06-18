# Production explorer — operational entrypoints.
# Usage: `make <target>`. See docs/ for full guides.

SHELL := /bin/bash
COMPOSE := docker compose

.PHONY: help init render up down restart logs ps build rebuild-frontend \
        migrate backup restore health pull clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

init: ## First-time setup: copy env templates if missing
	@for f in .env config/brand.env config/backend.env config/frontend.env; do \
	  [ -f $$f ] || cp $$f.example $$f && echo "created $$f (fill it in)"; done

render: ## Mirror brand.env values into .env build args + frontend.env
	@bash scripts/render-config.sh

fork: ## Materialize the upstream frontend fork (pinned tag)
	@bash scripts/fork-frontend.sh

prepare: ## Inject overlays/assets/patches into the materialized fork
	@bash scripts/prepare-frontend.sh

build: prepare ## Inject rebrand + build the frontend image
	$(COMPOSE) build frontend

rebuild-frontend: prepare ## Force-rebuild the rebranded frontend (after brand changes)
	$(COMPOSE) build --no-cache frontend

pull: ## Pull pinned backend/microservice images
	$(COMPOSE) pull db redis backend stats smart-contract-verifier visualizer sig-provider proxy

up: render ## Start the full stack (detached)
	$(COMPOSE) up -d

down: ## Stop the stack (keep volumes)
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

logs: ## Tail logs for all services
	$(COMPOSE) logs -f --tail=100

ps: ## Show service status
	$(COMPOSE) ps

health: ## Run the health-check script
	@bash scripts/healthcheck.sh

migrate: ## Run DB migrations explicitly (normally automatic on backend start)
	$(COMPOSE) exec backend bin/blockscout eval "Elixir.Explorer.ReleaseTasks.migrate()"

backup: ## Dump Postgres to backups/
	@bash scripts/backup.sh

restore: ## Restore Postgres from a dump (RESTORE_FILE=path)
	@bash scripts/restore.sh

clean: ## Stop and remove volumes (DESTRUCTIVE)
	$(COMPOSE) down -v
