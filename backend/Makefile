.PHONY: build run test clean seed migrate

# Build the application
build:
	go build -o main.exe cmd/server/main.go

# Run the application
run:
	go run cmd/server/main.go

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -f main.exe

# Run database migrations
migrate:
	go run cmd/migrate/main.go

# Seed database with initial data
seed:
	go run cmd/seed/main.go

# Seed all data (migrations + seed)
seed-all: migrate seed

# Run with hot reload (requires air)
dev:
	air

# Install dependencies
deps:
	go mod tidy
	go mod download

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Build for production
build-prod:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go 