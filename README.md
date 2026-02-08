# 🔥 Burn After 24h

An anonymous messaging web app where messages self-destruct after 24 hours.

## Features

- **Anonymous**: No accounts or login required
- **Auto-burn**: Messages delete automatically after 24 hours (MongoDB TTL)
- **Country flags**: Auto-detects visitor country via IP geolocation
- **Burn effects**: Visual flame/fade animations as messages approach expiration
- **Moderation**: Rate limiting, content filtering, and report system
- **Dark mode**: Fire/ember/ash aesthetic, mobile-first design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (with TTL indexes) |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run dev
```

Backend runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/burnafter24h
CORS_ORIGIN=http://localhost:5173
IPAPI_ENABLED=true
RATE_LIMIT_WINDOW_MS=3600000   # 1 hour
RATE_LIMIT_MAX_POSTS=5         # 5 messages per hour
RATE_LIMIT_MAX_REPORTS=10      # 10 reports per hour
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/messages` | List active messages |
| `POST` | `/api/messages` | Create new message |
| `GET` | `/api/messages/:id` | Get single message |
| `POST` | `/api/reports` | Report a message |

## Future Features (Extensibility)

The database schema is already prepared for:

- **Extend Burn Time**: Payment to add hours to message lifespan
- **Highlight Message**: Paid feature to pin/highlight your message
- **Private Messages**: Send to specific recipient via unique link

## Security

- IPs are SHA-256 hashed (never stored raw)
- Rate limiting per IP
- Multi-layer content filtering
- MongoDB TTL for automatic data deletion
- Helmet.js security headers
