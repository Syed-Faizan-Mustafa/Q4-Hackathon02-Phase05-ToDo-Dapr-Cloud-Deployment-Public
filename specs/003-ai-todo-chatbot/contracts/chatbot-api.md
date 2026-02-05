# API Contract: Chatbot API

**Feature**: 003-ai-todo-chatbot
**Date**: 2026-02-03
**Version**: 1.0.0

## Overview

This document defines the API contract for the AI Todo Chatbot endpoint. The chatbot exposes a single endpoint that processes natural language messages and returns AI-generated responses.

---

## Endpoint: POST /api/chat

Process a user message and return an AI-generated response.

### Request

**Method**: POST
**Path**: `/api/chat`
**Content-Type**: `application/json`
**Authentication**: Session cookie (Better Auth)

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Cookie` | Yes | Session cookie from Better Auth |

#### Request Body

```json
{
  "message": "string"
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `message` | string | Yes | 1-1000 chars | User's natural language message |

#### Example Request

```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"message": "Add buy groceries to my tasks"}'
```

---

### Response

**Content-Type**: `application/json`

#### Success Response (200 OK)

```json
{
  "success": true,
  "response": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for success |
| `response` | string | AI-generated response text |

#### Example Success Response

```json
{
  "success": true,
  "response": "I've added 'buy groceries' to your task list."
}
```

---

#### Error Response (4xx/5xx)

```json
{
  "success": false,
  "error": {
    "type": "string",
    "message": "string",
    "retryable": boolean,
    "retryAfter": number | null
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error.type` | string | Error type identifier |
| `error.message` | string | User-friendly error message |
| `error.retryable` | boolean | Whether user can retry |
| `error.retryAfter` | number? | Seconds until retry (rate limit only) |

#### Error Types

| Type | HTTP Status | Description |
|------|-------------|-------------|
| `validation` | 400 | Invalid request body |
| `auth_expired` | 401 | Session expired or invalid |
| `rate_limit` | 429 | Cohere API rate limited |
| `llm_unavailable` | 503 | Cohere API unavailable |
| `backend_error` | 502 | Phase II API error |
| `timeout` | 504 | Request timed out |
| `internal` | 500 | Unexpected server error |

#### Example Error Responses

**Validation Error (400)**
```json
{
  "success": false,
  "error": {
    "type": "validation",
    "message": "Message is required and must be 1-1000 characters",
    "retryable": false
  }
}
```

**Authentication Error (401)**
```json
{
  "success": false,
  "error": {
    "type": "auth_expired",
    "message": "Your session has expired. Please log in again.",
    "retryable": false
  }
}
```

**Rate Limit Error (429)**
```json
{
  "success": false,
  "error": {
    "type": "rate_limit",
    "message": "I'm a bit busy right now. Please try again in 30 seconds.",
    "retryable": true,
    "retryAfter": 30
  }
}
```

**Timeout Error (504)**
```json
{
  "success": false,
  "error": {
    "type": "timeout",
    "message": "That took too long. Please try again.",
    "retryable": true
  }
}
```

---

## Internal Flow

The `/api/chat` endpoint internally orchestrates multiple agents:

```
Request → Validate → Authenticate → Orchestrator
                                        ↓
                               Intent Analyzer (Cohere)
                                        ↓
                               Tool Executor (Phase II API)
                                        ↓
                               Response Composer (Cohere)
                                        ↓
                                    Response
```

### Agent Timeouts

| Agent | Timeout | Notes |
|-------|---------|-------|
| Intent Analyzer | 5s | Cohere API call |
| Tool Executor | 3s | Phase II API call |
| Response Composer | 5s | Cohere API call |
| **Total** | 10s | Hard limit per request |

---

## Phase II Backend API Integration

The Tool Executor agent calls the Phase II FastAPI backend:

### Backend Endpoints Used

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List tasks | GET | `/api/{user_id}/tasks` |
| Create task | POST | `/api/{user_id}/tasks` |
| Get task | GET | `/api/{user_id}/tasks/{task_id}` |
| Update task | PUT | `/api/{user_id}/tasks/{task_id}` |
| Delete task | DELETE | `/api/{user_id}/tasks/{task_id}` |

### Backend Request Headers

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Backend Error Handling

| Backend Status | Chatbot Behavior |
|----------------|------------------|
| 200-299 | Process response |
| 401 | Return `auth_expired` error |
| 404 | Return "task not found" response |
| 5xx | Return `backend_error` with retry |

---

## Rate Limiting

### Chatbot Endpoint

- No explicit rate limiting on `/api/chat` (inherits Vercel limits)
- Recommended: Add rate limiting in production (e.g., 20 req/min per user)

### Cohere API

- Respects Cohere rate limits (varies by plan)
- On 429 response: 30-second cooldown enforced client-side
- Exponential backoff not implemented (single retry only)

---

## Security Considerations

1. **Authentication**: Requires valid Better Auth session
2. **Authorization**: User can only access their own tasks
3. **Input Validation**: Message sanitized, length limited
4. **API Key Protection**: Cohere key server-side only
5. **Error Messages**: No internal details leaked to client
6. **CORS**: Configured for production domain only

---

## Versioning

This API is versioned implicitly. Future breaking changes will require:
- New endpoint path (e.g., `/api/v2/chat`)
- Deprecation notice for old endpoint
- Migration guide
