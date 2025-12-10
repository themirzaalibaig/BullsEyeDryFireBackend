# Ai-Chat Backend

A robust, enterprise-grade AI Chat Application backend built with TypeScript, Express, and Clean Architecture (Domain-Driven Design). This system manages AI chat interactions (with mocked OpenAI responses) and a comprehensive subscription management system with free quotas and paid tiers.

## Features

### Core Modules
*   **AI Chat Module**:
    *   Simulated OpenAI response generation with realistic latency.
    *   Intelligent quota tracker (Monthly usage & Free tier limits).
    *   Automatic token usage tracking.
    *   Prevents abuse with structured error handling for quota excesses.
    *   Supports message history retrieval.
*   **Subscription Module**:
    *   **Three Tiers**: Basic (10/mo), Pro (100/mo), Enterprise (Unlimited).
    *   **Billing Cycles**: Monthly & Yearly (Yearly offers 2 months free).
    *   **Smart Consumption**: Automatically deducts credits from the bundle with the earliest expiration date.
    *   **Lifecycle Management**: Create, Renew, and Cancel subscriptions.
    *   **Renewal Logic**: Simulated random payment failures (20% chance) to test error handling robustness.

### Technical Highlights
*   **Clean Architecture**: Separation of concerns into Domain, Service, Repository, and Controller layers.
*   **TypeScript-First**: Type safety across the entire application.
*   **Input Validation**: Strict validation using `zod`.
*   **Database**: PostgreSQL managed via Prisma ORM.
*   **Scalability**: Ready for Vercel Serverless deployment.

---

## Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Validation**: Zod
*   **Package Manager**: pnpm

---

## Setup Instructions

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18+)
*   [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
*   [PostgreSQL](https://www.postgresql.org/) (Local or Cloud instance like Neon)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/themirzaalibaig/Ai-Chat.git
cd Ai-Chat
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server
PORT=4000
NODE_ENV=development
API_VERSION=v1
API_PREFIX=/api
CORS_ORIGIN=*

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/ai_chat_db?schema=public"

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 4. Database Setup
Run the Prisma migrations to set up your database schema:
```bash
# Generate Prisma Client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# (Optional) Seed the database with a test user
pnpm prisma seed
```

### 5. Running the Application
| Mode | Command | Description |
| :--- | :--- | :--- |
| **Development** | `pnpm dev` | Starts dev server with hot-reload |
| **Build** | `pnpm build` | Compiles TypeScript to JavaScript |
| **Start** | `pnpm start` | Runs the compiled production build |

The API will be available at: `http://localhost:4000/api/v1`

---

## API Documentation

### Base URL
`http://localhost:4000/api/v1`

### Chat Module

#### 1. Send Message
Sends a user question to the AI. Automatically checks validation and quota.

*   **Endpoint**: `POST /chat/ask`
*   **Body**:
    ```json
    {
      "userId": "uuid-here",
      "question": "What is clean architecture?"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": "msg-id",
        "question": "What is clean architecture?",
        "answer": "This is a mocked AI response...",
        "tokens": 42,
        "createdAt": "2023-10-27T10:00:00Z"
      }
    }
    ```
*   **Error (403 Forbidden)**: If the user has no remaining quota.

#### 2. Get Chat History
Retrieves paginated chat history for a user.

*   **Endpoint**: `GET /chat/history`
*   **Query Params**: `userId=uuid-here`
*   **Response**:
    ```json
    {
      "success": true,
      "data": {
        "messages": [...],
        "total": 5
      }
    }
    ```

---

### Subscription Module

#### 1. Create Subscription
Purchase a new subscription bundle.

*   **Endpoint**: `POST /subscription/create`
*   **Body**:
    ```json
    {
      "userId": "uuid-here",
      "tier": "Basic",      // "Basic" | "Pro" | "Enterprise"
      "billingCycle": "monthly", // "monthly" | "yearly"
      "autoRenew": true
    }
    ```

#### 2. List User Subscriptions
Get all active and inactive bundles for a user.

*   **Endpoint**: `GET /subscription/list`
*   **Query Params**: `userId=uuid-here`
*   **Response**: Returns list of bundles sorted by creation date.

#### 3. Renew Subscription
Manually trigger a renewal (simulates billing attempt).

*   **Endpoint**: `POST /subscription/renew`
*   **Body**:
    ```json
    {
      "bundleId": "bundle-uuid-here"
    }
    ```
*   **Note**: This endpoint has a 20% random chance of returning a "Payment Failed" error to simulate real-world scenarios.

#### 4. Cancel Subscription
Cancels auto-renewal for a subscription. The user retains access until the current billing period ends.

*   **Endpoint**: `POST /subscription/cancel`
*   **Body**:
    ```json
    {
      "bundleId": "bundle-uuid-here"
    }
    ```

---

## Project Structure

```
src/
├── config/             # Environment & global configs
├── features/           # Modular feature organization (DDD)
│   ├── chat/           # Chat Module
│   │   ├── controllers # Request handlers
│   │   ├── domain/     # Entities & DTOs
│   │   ├── repositories# Data access interfaces & impls
│   │   ├── routes/     # Feature routes
│   │   └── services/   # Business logic
│   └── subscription/   # Subscription Module (Similar structure)
├── middlewares/        # Express middlewares (Validation, etc.)
├── types/              # Global type definitions
└── utils/              # Helper functions (Logger, Response handler)
```

---
**Author**: Mirza Ali Baig
