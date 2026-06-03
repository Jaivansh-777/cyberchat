.PHONY: install dev build clean

install:
	cd backend && npm install
	cd frontend && npm install
	cd backend && npx prisma generate

dev:
	docker compose up -d postgres redis
	cd backend && npm run start:dev &
	cd frontend && npm run dev &
	wait

db-push:
	cd backend && npx prisma db push

db-studio:
	cd backend && npx prisma studio

build:
	cd backend && npm run build
	cd frontend && npm run build

docker-up:
	docker compose up --build

docker-down:
	docker compose down

clean:
	rm -rf backend/dist frontend/.next
	rm -rf backend/node_modules frontend/node_modules
