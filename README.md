# Todo Full-Stack Web Application

AI-Powered Task Management with Microservices, Kafka, Dapr & Kubernetes

## Overview

A production-grade todo application built across multiple phases (Phase II-V), featuring an AI chatbot for natural language task management, microservices architecture, event-driven communication via Apache Kafka, Dapr runtime integration, and Kubernetes deployment.

## Project Report

A comprehensive 20-page PDF report documenting the entire project is available:

**[Todo-Application-Project-Report.pdf](docs/Todo-Application-Project-Report.pdf)**

The report covers: architecture, tech stack, AI chatbot pipeline, MCP tools, microservices, Kafka, Dapr, Kubernetes deployment, database schema, authentication, challenges & solutions, and future roadmap.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn/UI |
| **Backend** | FastAPI (Python 3.11), SQLModel, async SQLAlchemy |
| **Database** | PostgreSQL (Neon Serverless) |
| **Auth** | Better Auth (sessions) + JWT Bearer (backend) |
| **AI/LLM** | Cohere (command-r-plus) via MCP protocol |
| **Message Broker** | Apache Kafka (Confluent) |
| **Runtime** | Dapr 1.16.x (PubSub, State, Service Invocation) |
| **Orchestration** | Kubernetes (Minikube) + Helm 3 |
| **Containers** | Docker (multi-stage builds) |

## Architecture

```
Browser --> Next.js Frontend (3000)
  --> /api/tasks --> FastAPI Backend (8000) --> Neon PostgreSQL
  --> /api/chat --> Cohere LLM --> MCP Tools --> Backend API
  Backend --> Kafka --> Notification Service
  Backend --> Kafka --> Audit Service
  Backend --> Kafka --> Recurring Task Service
  Backend --> Kafka --> WebSocket Service --> Browser (real-time)
```

## Services

| Service | Framework | Port | Dapr | Purpose |
|---------|-----------|------|------|---------|
| Frontend | Next.js 14 | 3000 | No | UI, API proxy, AI chat |
| Backend | FastAPI | 8000 | Yes | Task CRUD, JWT auth, Kafka producer |
| Notification | FastAPI | 8080 | Yes | Email/push notifications |
| Audit | FastAPI | 8080 | Yes | Event logging and audit trail |
| Recurring Task | FastAPI | 8080 | Yes | Scheduled task regeneration |
| WebSocket | FastAPI | 8080 | Yes | Real-time browser updates |
| Kafka | Confluent | 9092 | No | Event message broker |
| Zookeeper | Apache | 2181 | No | Kafka coordination |

## AI Chatbot

The chatbot uses a 3-stage agent pipeline:

1. **Intent Analyzer** - Determines intent (10 types) and extracts entities
2. **MCP Tool Executor** - Maps intent to MCP tool and calls backend API
3. **Response Composer** - Generates user-friendly response with suggestions

### Supported Intents

`add_task` | `list_tasks` | `complete_task` | `incomplete_task` | `update_task` | `delete_task` | `set_due_date` | `set_priority` | `add_tags` | `general_chat`

## Features

- Task CRUD with inline editing and completion toggle
- AI chatbot sidebar (natural language in English/Urdu)
- Priority levels (high/medium/low)
- Tags (up to 10 per task)
- Due dates with overdue highlighting
- Recurring tasks (daily/weekly/monthly)
- Multi-criteria filtering (status, priority, tags, overdue, search)
- Sortable columns (date, priority, title)
- Client-side filtering with debounced search (300ms)

## Project Structure

```
.
├── frontend/               # Next.js 14 frontend
│   ├── app/                # App Router pages & API routes
│   ├── components/         # React components
│   ├── lib/
│   │   ├── agents/         # AI agent pipeline
│   │   ├── mcp/            # MCP tools (10 tools)
│   │   ├── auth.ts         # Better Auth client
│   │   ├── auth-server.ts  # Better Auth server config
│   │   └── api.ts          # Axios API client
│   └── Dockerfile          # Multi-stage build
├── backend/                # FastAPI backend
│   ├── src/
│   │   ├── api/            # Routes & dependencies
│   │   ├── models/         # SQLModel ORM (16-column tasks)
│   │   ├── middleware/      # Auth, CORS, rate limiting
│   │   └── main.py         # FastAPI app
│   └── Dockerfile
├── microservices/
│   ├── notification-service/
│   ├── audit-service/
│   ├── recurring-task-service/
│   └── websocket-service/
├── helm/
│   └── todo-app/           # Helm chart (v0.2.0)
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-local.yaml
│       └── templates/      # K8s manifests
├── scripts/                # Minikube setup, build, deploy scripts
├── docs/
│   └── Todo-Application-Project-Report.pdf
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+, Python 3.11+, Docker, Minikube, Helm 3, Dapr CLI

### Local Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt && uvicorn src.main:app --reload
```

### Minikube Deployment

```bash
# 1. Start Minikube
minikube start --cpus=2 --memory=4096

# 2. Install Dapr
dapr init -k --wait

# 3. Build images
eval $(minikube docker-env)
./scripts/build-images.sh

# 4. Deploy with Helm
./scripts/deploy.sh

# 5. Access frontend
kubectl port-forward svc/frontend 30000:3000 -n todo-app --address=0.0.0.0
# Open http://localhost:30000
```

## Deployment Status

### Production
- **Frontend**: Vercel
- **Backend**: HuggingFace Spaces
- **Database**: Neon PostgreSQL

### Local Cloud (Minikube)
- 8 pods running (6 services + Kafka + Zookeeper)
- 5 Dapr sidecars injected
- Helm chart managed

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Backend + Frontend | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Frontend | Session signing secret |
| `COHERE_API_KEY` | Frontend | Cohere LLM API key |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL |
| `NEXT_PUBLIC_AUTH_URL` | Frontend | Auth URL for trusted origins |

## Author

**Syed Faizan Mustafa**
- Course: Spec-Kit Plus - Agentic AI (Q4 Hackathon 02)
- Built with Claude Code (AI-assisted development)
