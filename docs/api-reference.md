# API Reference

## Base URL

```
http://localhost:3001/api
```

## Endpoints

### Health Check

```
GET /api/health
```

**Response** `200 OK`
```json
{ "status": "ok", "timestamp": "2026-02-06T12:00:00.000Z" }
```

---

### Create Log Entry

```
POST /api/logs
```

**Body**
| Field      | Type     | Required | Description                        |
|----------- |--------- |--------- |----------------------------------- |
| `level`    | string   | yes      | `debug`, `info`, `warn`, `error`, `fatal` |
| `message`  | string   | yes      | Log message text                   |
| `source`   | string   | yes      | Originating service name           |
| `metadata` | object   | no       | Arbitrary key-value pairs          |

**Response** `201 Created`
```json
{
  "id": "uuid",
  "level": "info",
  "message": "User login succeeded",
  "source": "auth-service",
  "timestamp": "2026-02-06T12:00:00.000Z",
  "metadata": { "userId": "123" }
}
```

---

### Query Logs

```
GET /api/logs?level=error&source=auth-service&search=login
```

**Query Parameters**
| Param    | Type   | Description                       |
|--------- |------- |---------------------------------- |
| `level`  | string | Filter by log level               |
| `source` | string | Filter by service source          |
| `search` | string | Full-text search on message field |

**Response** `200 OK`
```json
{
  "data": [ /* LogEntry[] */ ],
  "total": 42
}
```
