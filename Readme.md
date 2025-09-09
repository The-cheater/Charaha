
# Searchable Memory for Teams

A unified knowledge search system that ingests content from Slack and Google Docs, transforms it into searchable embeddings, and provides a natural language chat interface for teams to find relevant information quickly.

## Quick Start

**Stack:** Node.js backend, Next.js frontend, Hugging Face embeddings, Qdrant vector database, MongoDB Atlas

**MVP Features:**

- Ingest Slack channels and Google Docs content
- Semantic search with natural language queries
- Chat-style UI with source attribution
- Free-tier friendly architecture


## Architecture Overview

```
[Slack API] ──┐
              ├──> [Ingestion Service] ──> [Chunking] ──> [Embeddings] ──> [Qdrant Vector DB]
[Google Docs] ──┘                                  │
                                                   ├──> [MongoDB Metadata]
                                                   │
[User Query] ──> [Next.js UI] ──> [Query API] ────┘
```


## Tech Stack

### Core Technologies

- **Backend:** Node.js + Express
- **Frontend:** Next.js + React + Tailwind CSS
- **Vector Database:** Qdrant (cloud free tier)
- **Metadata Storage:** MongoDB Atlas (free tier)
- **Embeddings:** Hugging Face (`sentence-transformers/all-MiniLM-L6-v2`)


### Deployment

- **Frontend:** Vercel
- **Backend:** Render/Railway/Fly.io
- **Monitoring:** Optional (Sentry, LogRocket)


## Project Structure

### Backend (`/backend`)

```
backend/
├── src/
│   ├── server.js                 # Express server entry
│   ├── routes/
│   │   ├── ingest.routes.js      # Ingestion endpoints
│   │   ├── query.routes.js       # Search endpoints
│   │   └── auth.routes.js        # Authentication
│   ├── services/
│   │   ├── hf.service.js         # Hugging Face client
│   │   ├── qdrant.service.js     # Vector operations
│   │   ├── slack.service.js      # Slack integration
│   │   ├── google.service.js     # Google Docs integration
│   │   └── chunker.service.js    # Text chunking
│   ├── models/
│   │   ├── user.model.js
│   │   ├── source.model.js
│   │   └── chunk.model.js
│   └── scripts/
│       ├── ingest_slack.js       # CLI ingestion
│       └── ingest_drive.js
├── package.json
└── .env.example
```


### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── page.js                   # Main chat interface
│   ├── components/
│   │   ├── ChatInput.jsx
│   │   ├── MessageList.jsx
│   │   ├── ResultCard.jsx
│   │   └── SourceBadge.jsx
│   └── hooks/
│       └── useChat.js
├── package.json
└── .env.local.example
```


## Environment Setup

### Backend Environment (`.env`)

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/team_memory
QDRANT_URL=https://your-qdrant-instance.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

# AI Services
HF_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXX

# Authentication
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Integrations
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```


### Frontend Environment (`.env.local`)

```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_APP_NAME=TeamMemory
```


## Local Development

### Quick Setup (Using Cloud Services)

1. **Clone and setup backend:**
```bash
git clone <backend-repo> && cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

2. **Clone and setup frontend:**
```bash
git clone <frontend-repo> && cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

3. **Ingest sample data:**
```bash
# Ingest Slack channel
node src/scripts/ingest_slack.js --channel=C03ABCDEF --since=2025-08-01

# Ingest Google Doc
node src/scripts/ingest_drive.js --fileId=1a2b3c4d5e
```

4. **Access the application:**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:4000

### Local Setup with Docker

Use this `docker-compose.yml` for local Qdrant:

```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
```

Run: `docker-compose up -d` and set `QDRANT_URL=http://localhost:6333`

## API Reference

### Authentication

- `GET /auth/google` - Google OAuth redirect
- `GET /auth/google/callback` - OAuth callback


### Data Ingestion

- `POST /ingest/slack` - Ingest Slack channel
- `POST /ingest/drive` - Ingest Google Doc


### Search \& Query

```bash
POST /query
Content-Type: application/json

{
  "query": "Show me discussions about API keys from last week",
  "topK": 5,
  "filters": {
    "source": ["slack"],
    "dateFrom": "2025-08-01",
    "dateTo": "2025-08-31"
  }
}
```

**Response:**

```json
{
  "query": "Show me discussions about API keys from last week",
  "results": [
    {
      "score": 0.87,
      "text": "Hey team — the API key is stored in...",
      "source": "slack",
      "sourceUrl": "https://slack.com/archives/C03ABCDEF/p1234567890",
      "author": "alice@company.com",
      "timestamp": "2025-08-28T12:34:56Z"
    }
  ]
}
```


## Database Design

### MongoDB Collections

**Users Collection:**

```json
{
  "_id": "ObjectId",
  "email": "user@company.com",
  "name": "User Name",
  "roles": ["user", "admin"],
  "oauth": {
    "google": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

**Sources Collection:**

```json
{
  "_id": "ObjectId",
  "type": "slack_channel | google_doc",
  "externalId": "C03ABCDEF",
  "name": "engineering-team",
  "metadata": {
    "url": "...",
    "workspace": "company"
  },
  "ingestedAt": "ISODate"
}
```

**Chunks Collection:**

```json
{
  "_id": "ObjectId",
  "sourceId": "ObjectId",
  "qdrantPointId": "uuid-string",
  "text": "The actual chunk text...",
  "author": "alice@company.com",
  "timestamp": "ISODate",
  "metadata": {
    "channel": "engineering",
    "messageId": "..."
  }
}
```


### Qdrant Configuration

- **Collection:** `team_memory`
- **Vector Size:** 384 (for all-MiniLM-L6-v2)
- **Distance:** Cosine similarity


## Data Processing Pipeline

### Text Chunking Strategy

- **Chunk Size:** 1000 characters (~200-350 tokens)
- **Overlap:** 200 characters
- **Method:** Sliding window with context preservation


### Embedding Process

1. Normalize text (remove HTML, excessive whitespace)
2. Split into overlapping chunks
3. Generate embeddings via Hugging Face API
4. Store vectors in Qdrant with metadata
5. Save chunk references in MongoDB

## Deployment

### Production Deployment

**Frontend (Vercel):**

1. Push frontend repo to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy automatically

**Backend (Render/Railway):**

1. Push backend repo to GitHub
2. Create new web service
3. Configure environment variables
4. Set build/start commands
5. Deploy

### Cost Optimization

- MongoDB Atlas: Free tier (512MB)
- Qdrant Cloud: Free tier (1GB)
- Hugging Face: Free quota available
- Vercel: Free tier for frontend
- Render: Free tier for backend


## Security \& Privacy

### Access Control

- Google OAuth for Drive access
- JWT tokens for API authentication
- Slack webhook signature verification
- User-based result filtering


### Privacy Considerations

- PII detection and redaction
- GDPR compliance (right to be forgotten)
- User consent for message indexing
- Secure token storage


## Testing

### Unit Tests

```bash
npm test
```


### Integration Tests

```bash
npm run test:integration
```


### Manual Testing

1. Ingest sample data
2. Test search queries
3. Verify source attribution
4. Check mobile responsiveness

## Troubleshooting

### Common Issues

**Poor Search Results:**

- Try different embedding models
- Adjust chunk size
- Implement re-ranking

**Qdrant Connection Issues:**

- Verify vector size matches model
- Check API key and URL
- Ensure collection exists

**Rate Limiting:**

- Implement exponential backoff
- Use bulk operations where possible
- Monitor API quotas


## Roadmap

### Phase 1 (MVP)

- [x] Slack and Google Docs ingestion
- [x] Basic search functionality
- [x] Web interface


### Phase 2

- [ ] Real-time ingestion via webhooks
- [ ] Advanced filtering
- [ ] Mobile optimization


### Phase 3

- [ ] Additional connectors (Notion, GitHub)
- [ ] LLM-powered answer generation
- [ ] Analytics dashboard


### Phase 4

- [ ] Enterprise features (SSO, RBAC)
- [ ] Knowledge graph
- [ ] Mobile app


## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow ESLint and Prettier configurations
- Add tests for new features
- Update documentation
- Use conventional commit messages


## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation:** [Wiki](link-to-wiki)
- **Issues:** [GitHub Issues](link-to-issues)
- **Discussions:** [GitHub Discussions](link-to-discussions)

***

**Built with ❤️ for teams who value knowledge sharing**

