# Comandos do Térreo. Veja docs/documentacao/04-desenvolvimento.md.
.PHONY: dev down logs test test-web test-api lint e2e e2e-build build-demo serve-demo perf

dev:            ## Sobe db, redis, api, worker e web
	docker compose up --build -d --renew-anon-volumes
	@echo "Interface: http://localhost:3100  ·  API: http://localhost:3100/api/health"

down:
	docker compose down

logs:
	docker compose logs -f

test: test-web test-api

test-web:
	cd web && npm test

test-api:
	cd api && uv run pytest

lint:
	cd web && npm run lint && npm run typecheck
	cd api && uv run ruff check . && uv run ruff format --check .

e2e:            ## Requer `make dev` rodando (testes contra o next dev, no contêiner do Playwright)
	docker compose --profile e2e run --rm e2e npx playwright test --grep-invert @build $(ARGS)

e2e-build:      ## Gera a demonstração e roda os testes @build (PWA, demonstração) no contêiner do Playwright
	cd web && npm run build:demo && ln -sfn out out-current
	docker compose --profile e2e run --rm -e E2E_BUILD=1 e2e npx playwright test --grep @build $(ARGS)

build-demo:
	cd web && npm run build:demo

serve-demo:     ## Serve web/out na porta 3200
	cd web && npm run serve:out

perf:           ## Lighthouse (perfil móvel, 4G simulado) sobre o build de demonstração
	cd web && npm run build:demo
	docker compose --profile e2e run --rm e2e sh -c 'export CHROME_PATH=$$(ls -d /ms-playwright/chromium-*/chrome-linux*/chrome | head -1); npx lhci autorun'

