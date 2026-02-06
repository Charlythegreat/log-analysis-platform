# Log Analysis Platform

A professional monorepo for real-time log ingestion, querying, and visualization.

## Repository Structure

```
log-analysis-platform/
├── backend/            # NestJS REST API
│   ├── src/
│   │   ├── health/     # Health-check endpoint
│   │   ├── logs/       # Log ingestion & query module
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/           # Next.js dashboard
│   ├── src/
│   │   ├── app/        # App Router (layout + pages)
│   │   ├── components/ # React components
│   │   ├── lib/        # API client & utilities
│   │   └── styles/     # Global CSS
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/               # Project documentation
│   ├── architecture.md
│   ├── api-reference.md
│   └── setup.md
├── docker/             # Dockerfiles per service
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── scripts/            # Dev & CI helper scripts
│   ├── dev.sh
│   └── build.sh
├── docker-compose.yml  # Full-stack orchestration
├── .editorconfig
├── .env.example
├── .gitignore
└── package.json        # Root workspace config
```

## Quick Start

```bash
# Install all dependencies
npm install

# Start both services in dev mode
npm run dev

# Or run via Docker
npm run docker:up
```

| Service       | URL                                |
|-------------- |----------------------------------- |
| Frontend      | http://localhost:3000               |
| Backend API   | http://localhost:3001/api           |
| Swagger Docs  | http://localhost:3001/api/docs      |

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Setup](docs/setup.md)
- [API Reference](docs/api-reference.md)

## License

MIT