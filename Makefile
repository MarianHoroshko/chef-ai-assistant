APP_NAME = express-ts-app

# -----------------------------
# Backend
# -----------------------------

# -----------------------------
# Docker (Development)
# -----------------------------
build:
	cd backend && docker-compose build

up:
	cd backend && docker-compose up

down:
	cd backend && docker-compose down

logs:
	cd backend && docker logs -f express-ts-api

# -----------------------------
# Docker (Production)
# -----------------------------
prod-build:
	cd backend && docker build -t $(APP_NAME) -f Dockerfile .

prod-run:
	cd backend && docker run -p 3000:3000 $(APP_NAME)

prod-shell:
	cd backend && docker run -it $(APP_NAME) sh

# -----------------------------
# Utility
# -----------------------------
info:
	@echo "Node version: $$(node -v)"
	@echo "NPM version:  $$(npm -v)"
	@echo "Docker images:"
	@docker images | grep $(APP_NAME)

format:
	cd backend && npx prettier --write "src/**/*.{ts,js}"

lint:
	cd backend && npm run lint

lint-fix:
	cd backend && npm run lint:fix

# -----------------------------
# Test
# -----------------------------
test-api:
	python .\backend\scripts\test_api_script.py 

# -----------------------------
# Fill vector DB
# -----------------------------
fill-vector-db:
	python .\backend\scripts\fill_db_with_data_for_RAG.py


# -----------------------------
# Frontend
# -----------------------------
install-frontend:
	cd frontend && npm install

up-frontend:
	cd frontend && npm run dev