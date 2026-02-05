# Quickstart Guide: AI Todo Chatbot

**Feature**: 003-ai-todo-chatbot
**Date**: 2026-02-03

## Prerequisites

Before starting development on this feature, ensure you have:

1. **Phase II Todo App running** (frontend + backend)
2. **Node.js 18+** installed
3. **Cohere API key** (get one at https://dashboard.cohere.com/api-keys)

---

## Environment Setup

### 1. Configure Environment Variables

Add these to your `frontend/.env.local`:

```bash
# Cohere API Configuration
COHERE_API_KEY=your_cohere_api_key_here
COHERE_MODEL=command-r-plus

# Phase II Backend URL (use your deployed backend)
BACKEND_API_URL=https://syedfaizanmustafa-q4-hackathon-02-phase-ii.hf.space

# Agent Configuration
AGENT_INTENT_TEMPERATURE=0.3
AGENT_RESPONSE_TEMPERATURE=0.7
AGENT_MAX_TOKENS=1024

# Better Auth (should already exist from Phase II)
BETTER_AUTH_SECRET=your_existing_secret
```

### 2. Verify Backend Connection

Test that you can reach the Phase II backend:

```bash
curl -X GET "https://syedfaizanmustafa-q4-hackathon-02-phase-ii.hf.space/health"
# Expected: {"status": "healthy"}
```

### 3. Verify Cohere API Key

Test your Cohere API key:

```bash
curl -X POST "https://api.cohere.ai/v1/chat" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "command-r-plus", "message": "Hello"}'
# Expected: {"text": "Hello! How can I help you today?", ...}
```

---

## Project Structure

The chatbot feature adds these files to the existing frontend:

```
frontend/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts          # NEW: Chat API endpoint
├── components/
│   └── chat/                     # NEW: All chat components
│       ├── ChatWidget.tsx
│       ├── ChatBubble.tsx
│       ├── ChatWindow.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       ├── TypingIndicator.tsx
│       └── index.ts
├── hooks/
│   └── useChat.ts                # NEW: Chat state hook
├── lib/
│   └── agents/                   # NEW: Agent implementations
│       ├── cohere-adapter.ts
│       ├── orchestrator.ts
│       ├── intent-analyzer.ts
│       ├── tool-executor.ts
│       ├── response-composer.ts
│       └── types.ts
└── __tests__/
    └── chat/                     # NEW: Chat tests
```

---

## Development Workflow

### Step 1: Start the Development Server

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 and log in.

### Step 2: Add Chat Widget to Layout

Edit `frontend/app/layout.tsx` to include the ChatWidget:

```tsx
import { ChatWidget } from '@/components/chat';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget />  {/* Add this */}
      </body>
    </html>
  );
}
```

### Step 3: Test the Chatbot

1. Log in to the app
2. Look for the chat bubble icon (bottom-right corner)
3. Click to open the chat window
4. Try these commands:
   - "Add buy groceries"
   - "Show my tasks"
   - "Mark task 1 done"
   - "Delete task 2"

---

## Testing

### Run Unit Tests

```bash
cd frontend
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Test Coverage

```bash
npm test -- --coverage
```

---

## Common Issues

### "COHERE_API_KEY is not defined"

- Ensure `.env.local` exists in `frontend/` directory
- Restart the dev server after adding env vars

### "Backend unavailable" error

- Check if Phase II backend is running
- Verify `BACKEND_API_URL` is correct
- Check backend health endpoint

### "Rate limit" error

- Wait 30 seconds and retry
- Consider using `command-r` model (lower tier)

### Chat window not appearing

- Ensure you're logged in (authenticated pages only)
- Check browser console for errors
- Verify ChatWidget is in layout.tsx

---

## Deployment

### Vercel Configuration

1. Add environment variables in Vercel dashboard:
   - `COHERE_API_KEY`
   - `COHERE_MODEL`
   - `BACKEND_API_URL`
   - `AGENT_INTENT_TEMPERATURE`
   - `AGENT_RESPONSE_TEMPERATURE`
   - `AGENT_MAX_TOKENS`

2. Deploy:
```bash
vercel --prod
```

### Post-Deployment Checklist

- [ ] Chat icon appears on logged-in pages
- [ ] Chat window opens/closes smoothly
- [ ] Can add a task via chat
- [ ] Can list tasks via chat
- [ ] Error messages are user-friendly
- [ ] Mobile responsive works

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/api/chat/route.ts` | Serverless API endpoint |
| `components/chat/ChatWidget.tsx` | Main container component |
| `hooks/useChat.ts` | State management |
| `lib/agents/orchestrator.ts` | Agent coordination |
| `lib/agents/cohere-adapter.ts` | Cohere API wrapper |

---

## Related Documentation

- [spec.md](./spec.md) - Feature specification
- [plan.md](./plan.md) - Implementation plan
- [data-model.md](./data-model.md) - Type definitions
- [contracts/chatbot-api.md](./contracts/chatbot-api.md) - API contract
- [Constitution](../../.specify/memory/constitution.md) - Project principles
