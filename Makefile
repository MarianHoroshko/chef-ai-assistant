APP_NAME = express-ts-app

# -----------------------------
# Backend
# -----------------------------

# -----------------------------
# Docker (Development)
# -----------------------------
build:
	docker-compose build

up:
	docker-compose up --build

down:
	docker-compose down

logs:
	docker logs -f express-ts-api

# -----------------------------
# Docker (Production)
# -----------------------------
prod-build:
	docker build -t $(APP_NAME) -f Dockerfile .

prod-run:
	docker run -p 3000:3000 $(APP_NAME)

prod-shell:
	docker run -it $(APP_NAME) sh

# -----------------------------
# Utility
# -----------------------------
info:
	@echo "Node version: $$(node -v)"
	@echo "NPM version:  $$(npm -v)"
	@echo "Docker images:"
	@docker images | grep $(APP_NAME)

format:
	npx prettier --write "src/**/*.{ts,js}"

lint:
	npm run lint

lint-fix:
	npm run lint:fix

# -----------------------------
# Test
# -----------------------------
test-api:
	python .\scripts\test_api_script.py 

# -----------------------------
# Fill vector DB
# -----------------------------
fill-vector-db:
	python .\scripts\fill_db_with_data_for_RAG.py


# -----------------------------
# Frontend
# -----------------------------
install-frontend:
	cd frontend && npm install

up-frontend:
	cd frontend && npm run dev