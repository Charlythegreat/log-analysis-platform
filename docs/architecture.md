# Architecture Overview

## System Design

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Frontend   │────▶│   Backend    │────▶│ Elasticsearch │
│  (Next.js)   │     │  (NestJS)    │     │               │
│  Port 3000   │     │  Port 3001   │     │  Port 9200    │
└─────────────┘     └──────┬───────┘     └───────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │  Port 5432   │
                    └──────────────┘
```

## Folder Structure

| Folder       | Purpose                                         |
|------------- |------------------------------------------------- |
| `backend/`   | NestJS REST API — log ingestion, querying, auth  |
| `frontend/`  | Next.js dashboard — data visualization, search   |
| `docs/`      | Architecture docs, API reference, setup guides    |
| `scripts/`   | Development & CI helper scripts                   |
| `docker/`    | Dockerfiles for each service                      |

## Data Flow

1. **Ingestion** — External services POST log entries to `POST /api/logs`
2. **Storage** — Logs are stored in Elasticsearch (full-text search) with metadata in PostgreSQL
3. **Query** — The frontend queries `GET /api/logs` with filters (level, source, text search)
4. **Visualization** — The dashboard renders logs in real-time with charts and tables
