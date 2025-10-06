
# Searchable Memory for Teams
![Home Page](public/Screenshot%202025-09-15%20234442.png)

A unified knowledge search system that ingests content from Slack and Google Docs, transforms it into searchable embeddings, and provides a natural language chat interface for teams to find relevant information quickly.

## Quick Start

**Stack:** Node.js backend, Next.js frontend, Hugging Face embeddings, Qdrant vector database, MongoDB Atlas

**MVP Features:**

- Ingest Slack channels and Google Docs content
- Semantic search with natural language queries
- Chat-style UI with source attribution
- Free-tier friendly architecture

![Analytics](public/anal.png)

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

***

# Backend Architecture Documentation

## Complete Project Structure

```
backend/
├── src/
│   ├── server.js                     # 🚀 Application entry point
│   ├── app.js                        # 🔧 Express app configuration
│   │
│   ├── routes/                       # 🛣️ API endpoint definitions
│   │   ├── auth.routes.js            # Authentication & user management
│   │   ├── ingest.routes.js          # Data ingestion endpoints
│   │   ├── query.routes.js           # Search & query endpoints
│   │   └── webhook.routes.js         # Webhook handlers (Slack/Drive)
│   │
│   ├── controllers/                  # 🎮 Business logic handlers
│   │   ├── auth.controller.js        # Auth operations (login, signup, OAuth)
│   │   ├── ingest.controller.js      # Data ingestion orchestration
│   │   ├── query.controller.js       # Search request processing
│   │   └── webhook.controller.js     # Real-time webhook processing
│   │
│   ├── services/                     # 🔌 External integrations & core logic
│   │   ├── hf.service.js             # Hugging Face API integration
│   │   ├── qdrant.service.js         # Vector database operations
│   │   ├── slack.service.js          # Slack API integration
│   │   ├── google.service.js         # Google Drive/Docs API integration
│   │   ├── chunker.service.js        # Text processing & chunking
│   │   ├── ingest.service.js         # Data ingestion orchestration
│   │   ├── query.service.js          # Search logic & result processing
│   │   └── user.service.js           # User management utilities
│   │
│   ├── models/                       # 📊 Data models & schemas
│   │   └── mongodb/
│   │       ├── user.model.js         # User account schema
│   │       ├── source.model.js       # Data source tracking
│   │       ├── chunk.model.js        # Text chunk metadata
│   │       └── searchHistory.model.js # User search analytics
│   │
│   ├── middleware/                   # 🛡️ Request processing middleware
│   │   ├── errorHandler.js           # Global error handling
│   │   ├── requestLogger.js          # HTTP request logging
│   │   ├── auth.middleware.js        # JWT authentication
│   │   └── validation.middleware.js  # Input validation helper
│   │
│   ├── utils/                        # 🔧 Utility functions
│   │   ├── logger.js                 # Winston logging configuration
│   │   ├── validators.js             # Request validation schemas
│   │   ├── helpers.js                # General helper functions
│   │   └── constants.js              # Application constants
│   │
│   ├── config/                       # ⚙️ Configuration management
│   │   ├── mongo.config.js           # MongoDB connection setup
│   │   ├── qdrant.config.js          # Qdrant vector DB configuration
│   │   └── app.config.js             # Application settings
│   │
│   ├── scripts/                      # 📜 CLI tools & automation
│   │   ├── ingest_slack.js           # Slack data ingestion CLI
│   │   ├── ingest_drive.js           # Google Drive ingestion CLI
│   │   ├── setup_qdrant.js           # Vector DB initialization
│   │   └── migrate.js                # Database migration tool
│   │
│   └── jobs/                         # ⏰ Background task processors
│       ├── webhookHandler.js         # Real-time data processing
│       ├── embeddings.job.js         # Batch embedding generation
│       └── cleanup.job.js            # Data cleanup & maintenance
│
├── tests/                            # 🧪 Testing suite
│   ├── unit/                         # Unit tests
│   │   ├── auth.test.js              # Authentication logic tests
│   │   ├── ingest.test.js            # Ingestion service tests
│   │   └── query.test.js             # Search functionality tests
│   ├── integration/                  # Integration tests
│   │   ├── api.test.js               # Full API workflow tests
│   │   └── database.test.js          # Database operation tests
│   ├── setup.js                      # Test environment setup
│   └── teardown.js                   # Test cleanup
│
├── docs/                             # 📚 Documentation
├── logs/                             # 📝 Application logs
├── package.json                      # 📦 Dependencies & scripts
├── .env.example                      # 🔐 Environment variables template
├── .gitignore                        # 📋 Git ignore rules
├── .eslintrc.js                      # 🎯 Code quality rules
├── .prettierrc                       # 💅 Code formatting rules
├── jest.config.js                    # 🧪 Test configuration
├── nodemon.json                      # 🔄 Development server config
└── README.md                         # 📖 Project documentation
```
![TERMINAL](public/Screenshot%202025-10-05%20204440.png)

## Frontend Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Main layout component
│   ├── layout_old.tsx              # Legacy layout (optional)
│   ├── globals.css                 # Global styles (Tailwind)
│   ├── page.tsx                    # Landing page
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── signup/
│   │   └── page.tsx                # Signup page
│   ├── dashboard/
│   │   └── page.tsx                # User dashboard
│   ├── profile/
│   │   └── page.tsx                # User profile
│   ├── search/
│   │   ├── page.tsx                # Search main page
│   │   ├── advanced/
│   │   │   └── page.tsx            # Advanced search page
│   │   └── history/
│   │       └── page.tsx            # Search history page
│   ├── settings/
│   │   └── page.tsx                # User settings
│   ├── sources/
│   │   ├── page.tsx                # Sources overview
│   │   ├── add/
│   │   │   ├── google/
│   │   │   │   └── page.tsx        # Add Google source
│   │   │   └── slack/
│   │   │       └── page.tsx        # Add Slack source
│   │   ├── slack/
│   │   │   └── page.tsx            # Slack source details
│   │   └── [id]/
│   │       ├── page.tsx            # Source details
│   │       └── settings/
│   │           └── page.tsx        # Source settings
│   ├── analytics/
│   │   └── page.tsx                # Analytics dashboard
│   └── test-auth/
│       └── page.tsx                # Auth test page
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # App header
│   │   ├── Sidebar.tsx             # Sidebar navigation
│   │   ├── Footer.tsx              # App footer
│   │   └── ThemeToggle.tsx         # Light/dark mode toggle
│   ├── auth/
│   │   ├── LoginForm.tsx           # Login form
│   │   └── SignupForm.tsx          # Signup form
│   ├── dashboard/
│   │   ├── QuickActions.tsx        # Dashboard quick actions
│   │   ├── RecentActivity.tsx      # Recent activity feed (uses global searchHistory)
│   │   └── StatsCards.tsx          # Dashboard stats
│   ├── ingestion/
│   │   ├── GoogleDriveConnector.tsx# Google Drive connector
│   │   ├── SlackConnector.tsx      # Slack connector
│   │   ├── IngestionStatus.tsx     # Ingestion status display
│   │   └── SourceCard.tsx          # Data source card
│   ├── search/
│   │   ├── SearchInput.tsx         # Search bar
│   │   ├── SearchResults.tsx       # Search results list
│   │   ├── ResultCard.tsx          # Individual result card
│   │   ├── SearchStats.tsx         # Search statistics
│   │   ├── SearchSuggestions.tsx   # Query suggestions
│   │   ├── SearchHistory.tsx       # Search history
│   │   ├── AdvancedFilters.tsx     # Advanced search filters
│   │   └── FilterPanel.tsx         # Filter panel
│   ├── analytics/
│   │   ├── SearchStats.tsx         # Analytics search stats
│   │   ├── SourceStats.tsx         # Source analytics
│   │   └── SearchStats_old.tsx     # Legacy analytics
│   ├── landing/
│   │   ├── Hero.tsx                # Landing hero section
│   │   ├── Features.tsx            # Feature highlights
│   │   ├── Analytics.tsx           # Landing analytics
│   │   ├── Testimonials.tsx        # User testimonials
│   │   └── CTA.tsx                 # Call to action
│   ├── providers/
│   │   └── theme-provider.tsx      # Theme context provider
│   ├── ui/
│   │   ├── button.tsx              # UI button
│   │   ├── card.tsx                # UI card
│   │   ├── input.tsx               # UI input
│   │   ├── label.tsx               # UI label
│   │   ├── select.tsx              # UI select
│   │   ├── switch.tsx              # UI switch
│   │   ├── tabs.tsx                # UI tabs
│   │   ├── badge.tsx               # UI badge
│   │   ├── avatar.tsx              # UI avatar
│   │   ├── splite.tsx              # UI split element
│   │   ├── spotlight.tsx           # Spotlight effect
│   │   ├── ResultCard.tsx          # UI result card
│   │   └── text-hover-effect.tsx   # Text hover effect
│   └── ConnectionStatus.tsx        # API connection status
│
├── hooks/
│   ├── useAuth.tsx                 # Auth hook (React context/provider, must be .tsx)
│   ├── useChat.ts                  # Chat state hook
│   └── useSearch.ts                # Search state hook (now returns global searchHistory)
│
├── lib/
│   ├── api.ts                      # API utilities
│   ├── utils.ts                    # General utilities
│   └── validations.ts              # Validation helpers
│
├── types/
│   └── index.ts                    # TypeScript types
│
├── public/
│   ├── anal.png                    # Analytics image
│   ├── icon.ico                    # Favicon
│   └── Screenshot 2025-09-15 234442.png # Landing screenshot
│
├── components.json                 # Component registry
├── next.config.js                  # Next.js config
├── postcss.config.js               # PostCSS config
├── tailwind.config.js              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── next-env.d.ts                   # Next.js env types
├── package.json                    # Dependencies & scripts
├── package-lock.json               # Lockfile
└── node_modules/                   # Dependencies
```


***

## Core Application Files

### Entry Points

#### `src/server.js` 🚀

**Purpose:** Application bootstrap and server startup
**Key Features:**

- Database connection initialization
- Server startup on specified port
- Graceful shutdown handling
- Error handling for uncaught exceptions

```javascript
// Key responsibilities:
- MongoDB connection via connectDB()
- Express server startup
- SIGTERM/SIGINT signal handling
- Process error management
```


#### `src/app.js` 🔧

**Purpose:** Express application configuration and middleware setup
**Key Features:**

- Security middleware (Helmet, CORS)
- Rate limiting configuration
- Request parsing (JSON, URL-encoded)
- Route registration
- Global error handling

```javascript
// Middleware stack:
- helmet() // Security headers
- cors() // Cross-origin requests
- rateLimit() // Request throttling
- express.json() // JSON parsing
- express.urlencoded() // Form parsing
```


***

## Route Definitions (`src/routes/`)

### `auth.routes.js` 🔐

**Purpose:** Authentication and user management endpoints


| Method | Endpoint | Description | Authentication |
| :-- | :-- | :-- | :-- |
| POST | `/auth/signup` | User registration | None |
| POST | `/auth/login` | User login | None |
| POST | `/auth/logout` | User logout | None |
| GET | `/auth/google` | Google OAuth initiation | None |
| GET | `/auth/google/callback` | Google OAuth callback | None |
| GET | `/auth/me` | Get user profile | Required |
| PUT | `/auth/me` | Update user profile | Required |

**Validation:** Email format, password strength, name length

### `ingest.routes.js` 📥

**Purpose:** Data ingestion and source management


| Method | Endpoint | Description | Authentication |
| :-- | :-- | :-- | :-- |
| POST | `/ingest/slack` | Ingest Slack channel | Required |
| POST | `/ingest/drive` | Ingest Google Drive document | Required |
| GET | `/ingest/sources` | List user's data sources | Required |
| GET | `/ingest/sources/:id/status` | Get ingestion status | Required |
| DELETE | `/ingest/sources/:id` | Remove data source | Required |
| POST | `/ingest/bulk/slack` | Bulk Slack ingestion | Required |
| POST | `/ingest/bulk/drive` | Bulk Drive ingestion | Required |

**Features:** Progress tracking, bulk operations, error handling

### `query.routes.js` 🔍

**Purpose:** Search and query functionality


| Method | Endpoint | Description | Authentication |
| :-- | :-- | :-- | :-- |
| POST | `/query` | Basic semantic search | Required |
| POST | `/query/advanced` | Advanced search with filters | Required |
| GET | `/query/history` | User search history | Required |
| DELETE | `/query/history/:id` | Delete search entry | Required |
| GET | `/query/suggestions` | Search suggestions | Required |

**Features:** Semantic search, result ranking, search analytics

### `webhook.routes.js` 🔗

**Purpose:** Real-time data updates via webhooks


| Method | Endpoint | Description | Authentication |
| :-- | :-- | :-- | :-- |
| POST | `/webhook/slack/events` | Slack event notifications | Signature |
| POST | `/webhook/slack/interactive` | Slack interactions | Signature |
| POST | `/webhook/drive/changes` | Google Drive changes | Token |

**Security:** Webhook signature verification, request validation

***

## Controllers (`src/controllers/`)

### `auth.controller.js` 👤

**Responsibilities:**

- User registration and authentication
- JWT token generation and validation
- Google OAuth integration
- Profile management

**Key Methods:**

- `signup()` - User registration with validation
- `login()` - Credential verification and token issuance
- `authenticate()` - JWT middleware for protected routes
- `googleAuth()` / `googleCallback()` - OAuth flow handling
- `getProfile()` / `updateProfile()` - User data management


### `ingest.controller.js` 📊

**Responsibilities:**

- Orchestrate data ingestion from multiple sources
- Source management and status tracking
- Bulk operations coordination
- Error handling and progress reporting

**Key Methods:**

- `ingestSlack()` - Slack channel data processing
- `ingestDrive()` - Google Drive document processing
- `getSources()` - User's data source listing
- `deleteSource()` - Source removal with cleanup
- `bulkIngestSlack()` / `bulkIngestDrive()` - Batch processing


### `query.controller.js` 🎯

**Responsibilities:**

- Search request processing
- Result formatting and enrichment
- Search history management
- Query suggestions generation

**Key Methods:**

- `search()` - Basic semantic search execution
- `advancedSearch()` - Filtered search with re-ranking
- `getSearchHistory()` - User search analytics
- `getSuggestions()` - Query auto-completion


### `webhook.controller.js` 🔄

**Responsibilities:**

- Real-time webhook event processing
- Signature verification and security
- Event routing and handling
- Background job triggering

**Key Methods:**

- `handleSlackEvent()` - Slack message/channel updates
- `handleDriveChange()` - Google Drive file modifications
- `verifySlackSignature()` - Security validation

***

## Services (`src/services/`)

### `hf.service.js` 🤖

**Purpose:** Hugging Face API integration for text embeddings
**Features:**

- Text-to-vector conversion using sentence-transformers
- Batch embedding generation
- Error handling and retry logic
- Health checking

**Key Methods:**

```javascript
generateEmbedding(text) // Single text → vector
generateEmbeddings(texts) // Batch processing
healthCheck() // API availability
```


### `qdrant.service.js` 🔢

**Purpose:** Vector database operations and management
**Features:**

- Vector storage and retrieval
- Similarity search execution
- Collection management
- Point CRUD operations

**Key Methods:**

```javascript
upsertPoints(points) // Store vectors with metadata
search(vector, options) // Similarity search
deletePoints(pointIds) // Remove vectors
getCollectionInfo() // Database statistics
```


### `slack.service.js` 💬

**Purpose:** Slack API integration and data extraction
**Features:**

- Channel message retrieval
- User and channel information
- Thread conversation handling
- Message formatting and cleaning

**Key Methods:**

```javascript
getChannelHistory(channelId, options) // Message retrieval
getChannelInfo(channelId) // Channel metadata
getUserInfo(userId) // User details
formatMessageText(text) // Text normalization
```


### `google.service.js` 📄

**Purpose:** Google Drive and Docs API integration
**Features:**

- OAuth token management
- Document content extraction
- File metadata retrieval
- Folder traversal

**Key Methods:**

```javascript
getGoogleUser(code) // OAuth user info
getDocumentContent(docId) // Document text extraction
getFileMetadata(fileId) // File information
getFilesInFolder(folderId) // Directory listing
```


### `chunker.service.js` ✂️

**Purpose:** Text processing and chunking for embeddings
**Features:**

- Sliding window text segmentation
- Context preservation with overlap
- Metadata attachment
- Source-specific processing

**Key Methods:**

```javascript
chunkText(text, metadata) // Generic text chunking
chunkSlackMessage(message, channelInfo) // Slack-specific processing
chunkDocument(document, metadata) // Document processing
normalizeText(text) // Text cleaning
```


### `ingest.service.js` 🔄

**Purpose:** Data ingestion orchestration and coordination
**Features:**

- Multi-source data processing
- Chunk generation and storage
- Vector embedding pipeline
- Progress tracking and error handling

**Key Methods:**

```javascript
ingestSlackChannel(options) // Complete Slack processing
ingestGoogleDrive(options) // Complete Drive processing
deleteSource(sourceId, userId) // Source removal
processSlackMessage(data) // Real-time message processing
```


### `query.service.js` 🔍

**Purpose:** Search logic and result processing
**Features:**

- Semantic search execution
- Result ranking and filtering
- Query suggestion generation
- Search history management

**Key Methods:**

```javascript
search(query, options) // Basic search
advancedSearch(query, options) // Enhanced search
buildQdrantFilter(filters, userId) // Filter construction
rerankResults(query, results) // Result optimization
```


### `user.service.js` 👥

**Purpose:** User management and analytics
**Features:**

- User statistics generation
- Preference management
- Data deletion (GDPR compliance)
- Usage analytics

***

## Data Models (`src/models/mongodb/`)

### `user.model.js` 👤

**Schema Design:**

```javascript
{
  email: String (unique, required),
  password: String (hashed, select: false),
  name: String (required),
  roles: [String] (enum: ['user', 'admin']),
  oauth: {
    google: {
      id: String,
      accessToken: String,
      refreshToken: String
    }
  },
  preferences: {
    defaultSources: [String],
    searchHistory: Boolean
  },
  timestamps: true
}
```

**Indexes:** `email` (unique), compound indexes for efficient queries

### `source.model.js` 📚

**Schema Design:**

```javascript
{
  type: String (enum: ['slack_channel', 'google_doc', 'google_drive_folder']),
  externalId: String (required),
  name: String (required),
  metadata: {
    url: String,
    workspace: String,
    fileName: String,
    mimeType: String
  },
  userId: ObjectId (ref: 'User'),
  status: String (enum: ['pending', 'processing', 'completed', 'failed']),
  stats: {
    totalChunks: Number,
    totalMessages: Number,
    lastMessageDate: Date
  },
  timestamps: true
}
```

**Indexes:** Compound index on `type + externalId + userId` (unique)

### `chunk.model.js` 📝

**Schema Design:**

```javascript
{
  sourceId: ObjectId (ref: 'Source'),
  externalId: String (required),
  qdrantPointId: String (unique),
  text: String (required),
  startChar: Number,
  endChar: Number,
  author: String,
  timestamp: Date,
  metadata: {
    channel: String,
    messageId: String,
    fileName: String,
    type: String (enum: ['text', 'code', 'quote', 'list'])
  },
  timestamps: true
}
```

**Indexes:** `sourceId + timestamp`, `qdrantPointId` (unique), `author + timestamp`

### `searchHistory.model.js` 📊

**Schema Design:**

```javascript
{
  userId: ObjectId (ref: 'User'),
  query: String (required),
  filters: {
    sources: [String],
    dateFrom: Date,
    dateTo: Date,
    authors: [String]
  },
  results: [{
    chunkId: ObjectId (ref: 'Chunk'),
    score: Number,
    rank: Number
  }],
  resultCount: Number,
  responseTime: Number,
  timestamps: true
}
```

**TTL Index:** Auto-delete entries after 30 days

***

## Middleware (`src/middleware/`)

### `errorHandler.js` ❌

**Purpose:** Global error handling and response formatting
**Features:**

- Error type classification
- Development vs production error details
- HTTP status code mapping
- Error logging integration


### `requestLogger.js` 📝

**Purpose:** HTTP request logging and monitoring
**Features:**

- Request/response logging
- Performance timing
- User activity tracking
- Debug information


### `auth.middleware.js` 🛡️

**Purpose:** Authentication and authorization
**Features:**

- JWT token validation
- User role checking
- Route protection
- Token refresh handling


### `validation.middleware.js` ✅

**Purpose:** Input validation helper
**Features:**

- Express-validator integration
- Error message formatting
- Validation rule application

***

## Utilities (`src/utils/`)

### `logger.js` 📊

**Purpose:** Winston logging configuration
**Features:**

- Multiple log levels (error, warn, info, debug)
- File rotation and archiving
- Console output for development
- Structured JSON logging


### `validators.js` ✅

**Purpose:** Request validation schemas
**Validation Rules:**

- Email format and uniqueness
- Password strength requirements
- API parameter validation
- File ID format checking


### `helpers.js` 🛠️

**Purpose:** General utility functions
**Functions:**

- Text similarity calculation
- File size formatting
- Array chunking
- String sanitization
- Crypto operations


### `constants.js` 📋

**Purpose:** Application-wide constants
**Definitions:**

- Source types and statuses
- User roles and permissions
- File MIME types
- Rate limiting configurations
- Embedding settings

***

## Configuration (`src/config/`)

### `mongo.config.js` 🗄️

**Purpose:** MongoDB connection management
**Features:**

- Connection pooling
- Retry logic
- Event handling (connect, disconnect, error)
- Development vs production settings


### `qdrant.config.js` 🔢

**Purpose:** Vector database configuration
**Features:**

- Collection initialization
- Vector size configuration (384 dimensions)
- Distance metric setup (Cosine similarity)
- Connection management


### `app.config.js** ⚙️

**Purpose:** Application settings centralization
**Settings:**

- Chunking parameters
- Search configurations
- Rate limiting rules
- Embedding model specifications

***

## Scripts (`src/scripts/`)

### `ingest_slack.js` 💬

**Purpose:** CLI tool for Slack data ingestion
**Features:**

- Command-line argument parsing
- Batch message processing
- Progress reporting
- Error handling and recovery

**Usage:**

```bash
node src/scripts/ingest_slack.js --channel C03ABCDEF --since 2025-08-01 --userId user123
```


### `ingest_drive.js` 📄

**Purpose:** CLI tool for Google Drive ingestion
**Features:**

- File and folder processing
- OAuth token management
- Batch operations
- Progress tracking

**Usage:**

```bash
node src/scripts/ingest_drive.js --fileId 1a2b3c4d5e --userId user123
```


### `setup_qdrant.js` 🚀

**Purpose:** Vector database initialization
**Features:**

- Collection creation
- Index configuration
- Health checking
- Migration support


### `migrate.js** 🔄

**Purpose:** Database migration and maintenance
**Features:**

- Index creation
- Schema updates
- Data migration
- Cleanup operations

***

## Background Jobs (`src/jobs/`)

### `webhookHandler.js` 🔄

**Purpose:** Real-time webhook event processing
**Features:**

- Slack message processing
- Google Drive change handling
- Event queuing and batching
- Error recovery


### `embeddings.job.js` 🤖

**Purpose:** Background embedding generation
**Features:**

- Batch processing of unembedded chunks
- Queue management
- Retry logic for failed embeddings
- Progress tracking


### `cleanup.job.js** 🧹

**Purpose:** Data maintenance and cleanup
**Features:**

- Orphaned chunk removal
- Old search history cleanup
- Failed source cleanup
- Vector database synchronization

***

## Testing Suite (`tests/`)

### Unit Tests (`tests/unit/`)

- **`auth.test.js`**: Authentication logic validation
- **`ingest.test.js`**: Data processing functionality
- **`query.test.js`**: Search algorithm testing


### Integration Tests (`tests/integration/`)

- **`api.test.js`**: Full API workflow testing
- **`database.test.js`**: Database operation validation


### Test Configuration

- **`setup.js`**: Test environment initialization
- **`teardown.js`**: Test cleanup procedures
- **`jest.config.js`**: Testing framework configuration

***

## Environment Setup

### Backend Environment (`.env`)

```env
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb+srv://user:password@cluster0.mongodb.net/team_memory?retryWrites=true&w=majority

# Qdrant Vector Database
QDRANT_URL=https://your-qdrant-instance.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=team_memory

# AI Services
HF_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXX
HF_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google OAuth & Drive API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT=http://localhost:4000/auth/google/callback

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```


## Development Workflow

### Installation \& Setup

```bash
# 1. Clone and setup backend
git clone <backend-repo> && cd backend
npm install
cp .env.example .env
# Configure your environment variables

# 2. Initialize databases
npm run script:setup-qdrant
npm run script:migrate

# 3. Start development server
npm run dev

# 4. Run tests
npm test
npm run test:integration

# 5. Lint and format code
npm run lint
npm run lint:fix
```


### CLI Operations

```bash
# Ingest Slack channel
npm run ingest:slack -- --channel=C03ABCDEF --since=2025-08-01 --userId=user123

# Ingest Google Doc
npm run ingest:drive -- --fileId=1a2b3c4d5e --userId=user123

# Setup Qdrant collection
npm run script:setup-qdrant

# Run database migrations
npm run script:migrate
```


***

## API Reference

### Authentication Endpoints

#### POST `/auth/signup`

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["user"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```


#### POST `/auth/login`

Authenticate user credentials.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```


### Data Ingestion Endpoints

#### POST `/ingest/slack`

Ingest messages from a Slack channel.

**Request:**

```json
{
  "channel": "C03ABCDEF",
  "since": "2025-08-01T00:00:00Z",
  "workspace": "company-workspace"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Slack channel ingestion completed",
  "data": {
    "sourceId": "source123",
    "messagesProcessed": 150,
    "chunksCreated": 75
  }
}
```


#### POST `/ingest/drive`

Ingest content from Google Drive.

**Request:**

```json
{
  "fileId": "1a2b3c4d5e6f7g8h9i",
  "since": "2025-08-01T00:00:00Z"
}
```


### Search \& Query Endpoints

#### POST `/query`

Perform semantic search across ingested content.

**Request:**

```json
{
  "query": "Show me discussions about API keys from last week",
  "topK": 5,
  "filters": {
    "sources": ["slack_channel"],
    "dateFrom": "2025-08-01",
    "dateTo": "2025-08-31",
    "authors": ["alice@company.com"]
  }
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "query": "Show me discussions about API keys from last week",
    "results": [
      {
        "score": 0.87,
        "text": "Hey team — the API key is stored in...",
        "chunkId": "chunk123",
        "source": "slack_channel",
        "sourceUrl": "https://slack.com/archives/C03ABCDEF/p1234567890",
        "author": "alice@company.com",
        "timestamp": "2025-08-28T12:34:56Z",
        "metadata": {
          "sourceName": "engineering-team",
          "channel": "general"
        }
      }
    ],
    "responseTime": 245,
    "metadata": {
      "totalResults": 5,
      "topK": 5
    }
  }
}
```


***

## Database Design

### MongoDB Collections

#### Users Collection

Stores user accounts, authentication data, and preferences.

```json
{
  "_id": "ObjectId",
  "email": "user@company.com",
  "password": "$2b$12$hashedPassword",
  "name": "User Name",
  "roles": ["user", "admin"],
  "oauth": {
    "google": {
      "id": "google-user-id",
      "accessToken": "ya29.access-token",
      "refreshToken": "1//refresh-token"
    }
  },
  "preferences": {
    "defaultSources": ["slack", "google-docs"],
    "searchHistory": true
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```


#### Sources Collection

Tracks ingested data sources and their status.

```json
{
  "_id": "ObjectId",
  "type": "slack_channel",
  "externalId": "C03ABCDEF",
  "name": "engineering-team",
  "metadata": {
    "url": "https://slack.com/channels/C03ABCDEF",
    "workspace": "company",
    "permissions": ["read"]
  },
  "userId": "ObjectId",
  "status": "completed",
  "stats": {
    "totalChunks": 150,
    "totalMessages": 75,
    "lastMessageDate": "ISODate"
  },
  "ingestedAt": "ISODate",
  "lastSyncAt": "ISODate"
}
```


#### Chunks Collection

Stores processed text chunks with metadata and vector references.

```json
{
  "_id": "ObjectId",
  "sourceId": "ObjectId",
  "externalId": "1234567890.123456",
  "qdrantPointId": "uuid-string",
  "text": "The actual chunk text content...",
  "startChar": 0,
  "endChar": 512,
  "author": "alice@company.com",
  "timestamp": "ISODate",
  "metadata": {
    "channel": "engineering",
    "messageId": "1234567890.123456",
    "threadId": "1234567890.123456",
    "type": "text"
  }
}
```


### Qdrant Vector Database

#### Collection Configuration

- **Collection Name:** `team_memory`
- **Vector Size:** 384 dimensions (for all-MiniLM-L6-v2)
- **Distance Metric:** Cosine similarity
- **Indexing:** HNSW algorithm for efficient search


#### Vector Point Structure

```json
{
  "id": "chunk-uuid",
  "vector": [0.1, 0.2, -0.1, ...], // 384 dimensions
  "payload": {
    "chunkId": "mongodb-chunk-id",
    "sourceType": "slack_channel",
    "sourceUrl": "https://slack.com/archives/...",
    "author": "alice@company.com",
    "timestamp": "2025-08-28T12:34:56Z",
    "channel": "engineering"
  }
}
```


***

## Data Processing Pipeline

### Text Chunking Strategy

#### Configuration

- **Max Chunk Size:** 1000 characters (~200-350 tokens)
- **Overlap Size:** 200 characters
- **Method:** Sliding window with context preservation
- **Min Chunk Size:** 50 characters


#### Processing Flow

```mermaid
graph LR
    A[Raw Text] --> B[Text Normalization]
    B --> C[Chunk Segmentation]
    C --> D[Metadata Attachment]
    D --> E[Embedding Generation]
    E --> F[Vector Storage]
    F --> G[MongoDB Reference]
```


### Embedding Process

#### Hugging Face Integration

1. **Text Preprocessing:** Remove HTML, normalize whitespace, handle special characters
2. **Batch Processing:** Group chunks for efficient API usage
3. **Vector Generation:** Use sentence-transformers/all-MiniLM-L6-v2 model
4. **Quality Validation:** Verify vector dimensions and numerical validity
5. **Storage:** Upsert vectors to Qdrant with rich metadata

#### Error Handling

- Retry logic for API failures
- Fallback to smaller batch sizes
- Dead letter queue for failed embeddings
- Health monitoring and alerts

***

## Security \& Privacy

### Authentication \& Authorization

#### JWT Token Management

- **Algorithm:** HS256
- **Expiration:** 7 days (configurable)
- **Claims:** User ID, roles, issued/expiration times
- **Refresh:** Automatic token refresh on API calls


#### Google OAuth Integration

- **Scopes:** Profile, email, Drive read-only, Docs read-only
- **Token Storage:** Encrypted in database
- **Refresh:** Automatic token refresh using refresh tokens


### Data Protection

#### Encryption

- **Passwords:** bcrypt with salt rounds = 12
- **Tokens:** Stored encrypted in database
- **API Keys:** Environment variables only
- **Transport:** HTTPS/TLS in production


#### Access Control

- **User-based filtering:** Users only see their own data
- **Role-based permissions:** Admin vs user capabilities
- **Source ownership:** Strict source-to-user association
- **API rate limiting:** Per-user request throttling


### Privacy Compliance

#### GDPR Features

- **Right to be forgotten:** Complete user data deletion
- **Data export:** User data download functionality
- **Consent tracking:** Explicit permissions for data processing
- **PII detection:** Basic personal information filtering


#### Data Retention

- **Search history:** 30-day automatic deletion
- **Failed sources:** 24-hour cleanup cycle
- **Log files:** 30-day rotation
- **Vector embeddings:** Permanent storage with user consent

***

## Performance \& Scaling

### Optimization Strategies

#### Database Performance

- **Indexing:** Compound indexes for common query patterns
- **Connection pooling:** Efficient MongoDB connections
- **Query optimization:** Aggregation pipelines for complex queries
- **Caching:** In-memory caching for frequent requests


#### Vector Search Performance

- **HNSW indexing:** Fast approximate nearest neighbor search
- **Batch operations:** Efficient bulk vector operations
- **Result caching:** Cache frequent search results
- **Progressive search:** Load results as needed


### Scaling Considerations

#### Horizontal Scaling

- **Stateless design:** No server-side sessions
- **Database sharding:** User-based data partitioning
- **Load balancing:** Multiple backend instances
- **CDN integration:** Static asset delivery


#### Cost Management

- **Free tiers:** MongoDB Atlas (512MB), Qdrant Cloud (1GB)
- **Efficient APIs:** Batch requests to external services
- **Resource monitoring:** Usage tracking and alerts
- **Graceful degradation:** Fallback strategies for API failures

***

## Monitoring \& Observability

### Logging Strategy

#### Log Levels

- **ERROR:** System failures, API errors, data corruption
- **WARN:** Rate limiting, deprecated features, performance issues
- **INFO:** User actions, system events, ingestion progress
- **DEBUG:** Detailed execution flow, variable values


#### Log Structure

```json
{
  "timestamp": "2025-09-14T22:15:30.123Z",
  "level": "info",
  "message": "User search completed",
  "service": "team-memory-backend",
  "userId": "user123",
  "query": "API keys configuration",
  "responseTime": 245,
  "resultCount": 5
}
```


### Health Monitoring

#### Health Check Endpoints

- **`/health`:** Basic service availability
- **Database connectivity:** MongoDB and Qdrant status
- **External APIs:** Hugging Face, Slack, Google APIs
- **Resource usage:** Memory, CPU, disk utilization


#### Metrics Collection

- **Request metrics:** Response times, error rates, throughput
- **Business metrics:** Search queries, ingestion rates, user growth
- **System metrics:** Database performance, API quotas, error logs
- **User metrics:** Search success rates, feature usage, retention

***

## Deployment Guide

### Production Deployment

#### Backend Deployment (Render/Railway/Fly.io)

1. **Repository Setup:**

```bash
git clone <backend-repo>
cd backend
```

2. **Environment Configuration:**
    - Set all production environment variables
    - Configure database connection strings
    - Set up API keys and secrets
3. **Build Configuration:**

```json
{
  "scripts": {
    "build": "npm install",
    "start": "node src/server.js"
  }
}
```

4. **Health Checks:**
    - Configure `/health` endpoint monitoring
    - Set up restart policies
    - Configure resource limits

#### Database Setup

##### MongoDB Atlas

1. Create cluster (free tier: 512MB)
2. Configure network access (IP whitelist)
3. Create database user
4. Set up connection string

##### Qdrant Cloud

1. Create cluster (free tier: 1GB)
2. Get API key and endpoint URL
3. Initialize collection via setup script

### Environment-Specific Configuration

#### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
MONGO_URI=mongodb://localhost:27017/team_memory_dev
QDRANT_URL=http://localhost:6333
```


#### Production

```env
NODE_ENV=production
LOG_LEVEL=info
MONGO_URI=mongodb+srv://prod-user:pass@cluster.mongodb.net/team_memory
QDRANT_URL=https://prod-cluster.qdrant.io
```


***

## Troubleshooting Guide

### Common Issues

#### Database Connection Problems

**Symptoms:** Connection timeouts, authentication failures
**Solutions:**

- Verify connection strings and credentials
- Check network connectivity and firewall rules
- Monitor connection pool usage
- Review MongoDB Atlas IP whitelist


#### Vector Search Issues

**Symptoms:** Poor search results, slow queries
**Solutions:**

- Verify vector dimensions match model output (384)
- Check Qdrant collection configuration
- Review embedding quality and text preprocessing
- Monitor search performance metrics


#### API Integration Failures

**Symptoms:** External API errors, quota exceeded
**Solutions:**

- Implement exponential backoff retry logic
- Monitor API quota usage and limits
- Use batch operations where possible
- Set up alternative providers or fallbacks


#### Memory and Performance Issues

**Symptoms:** High memory usage, slow response times
**Solutions:**

- Optimize database queries with proper indexing
- Implement result caching for frequent requests
- Use pagination for large result sets
- Monitor and optimize batch processing sizes


### Debugging Tools

#### Development Tools

```bash
# Debug logging
DEBUG=* npm run dev

# Database queries
mongosh "mongodb+srv://cluster.mongodb.net" --username user

# API testing
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "test search"}'

# Health check
curl http://localhost:4000/health
```


#### Production Monitoring

- **Application logs:** Centralized logging with structured JSON
- **Performance metrics:** Response times, error rates, throughput
- **Resource monitoring:** CPU, memory, disk, network usage
- **External service monitoring:** API availability and quota usage

***

## Future Roadmap

### Phase 2: Enhanced Features

- [ ] Real-time ingestion via webhooks
- [ ] Advanced filtering and faceted search
- [ ] Mobile-responsive design optimization
- [ ] Enhanced analytics and reporting


### Phase 3: AI \& Intelligence

- [ ] Additional connectors (Notion, GitHub, Confluence)
- [ ] LLM-powered answer generation and summarization
- [ ] Knowledge graph relationships
- [ ] Smart content recommendations


### Phase 4: Enterprise Ready

- [ ] Single Sign-On (SSO) integration
- [ ] Role-based access control (RBAC)
- [ ] Audit logging and compliance
- [ ] Multi-tenant architecture
- [ ] Advanced security features


### Phase 5: Advanced Analytics

- [ ] Usage analytics dashboard
- [ ] Search quality metrics
- [ ] Content gap analysis
- [ ] Knowledge base optimization
- [ ] Machine learning insights

***

## Contributing

### Development Guidelines

#### Code Standards

- **ESLint:** Enforced code quality rules
- **Prettier:** Consistent code formatting
- **Jest:** Comprehensive test coverage (>70%)
- **Conventional Commits:** Structured commit messages


#### Pull Request Process

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feat/amazing-feature`
3. **Implement** changes with tests
4. **Update** documentation
5. **Commit** with conventional format: `git commit -m 'feat: add amazing feature'`
6. **Push** to branch: `git push origin feat/amazing-feature`
7. **Open** Pull Request with detailed description

#### Testing Requirements

- Unit tests for all service functions
- Integration tests for API endpoints
- Database operation tests
- Error handling validation
- Performance benchmarks

***

## Support \& Resources

### Documentation Links

- **API Documentation:** [Swagger/OpenAPI Spec](link-to-api-docs)
- **Database Schema:** [ERD Diagrams](link-to-schema-docs)
- **Architecture Guide:** [Technical Deep Dive](link-to-architecture)


### Community \& Help

- **Issues:** [GitHub Issues](https://github.com/repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/repo/discussions)
- **Wiki:** [Project Wiki](https://github.com/repo/wiki)


### License

MIT License - see [LICENSE](LICENSE) file for details.

***

**Built with ❤️ for teams who value knowledge sharing and intelligent search**[^1]
