# Development Setup

## Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** & **Docker Compose** (for full-stack local development)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Charlythegreat/log-analysis-platform.git
cd log-analysis-platform

# 2. Copy environment variables
cp .env.example .env

# 3. Install all dependencies (uses npm workspaces)
npm install

# 4. Start both frontend and backend in dev mode
npm run dev
```

- **Frontend** → http://localhost:3000
- **Backend**  → http://localhost:3001
- **API Docs** → http://localhost:3001/api/docs (Swagger)

## Docker (full stack)

```bash
# Build and start all services
npm run docker:up

# Tear down
npm run docker:down
```

## Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend
```

## Linting

```bash
npm run lint
```
