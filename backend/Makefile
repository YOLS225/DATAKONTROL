PROJECT_NAME = validation-platform

IMAGE = yols225/validation-platform
TAG = latest

COMPOSE = docker compose -f compose.yaml -p $(PROJECT_NAME)

.PHONY: build up down restart clean reset push

## Build les images et démarre les services
build:
	$(COMPOSE) up -d --build

## Démarre les services
up:
	$(COMPOSE) up -d

## Arrête les services
down:
	$(COMPOSE) down

## Redémarre les services
restart:
	$(COMPOSE) restart


## Nettoyage complet (containers + volumes)
clean:
	$(COMPOSE) down -v --remove-orphans
	docker volume rm -f \
		validation-platform_postgres_data \
		validation-platform_redis_data \
		validation-platform_minio_data || true

## Recréation complète
reset: clean build

## Build & Push Docker Hub
push:
	docker buildx build \
		--platform linux/amd64 \
		-t $(IMAGE):$(TAG) \
		--push .