# Credentials & Environment Variables Guide

This document explains where all credentials and environment variables are stored and how to use them in Phase III AI Todo Chatbot.

## Quick Reference

| Credential | File Location | Git Status | Usage |
|------------|---------------|------------|-------|
| Cohere API Key | `.env.local` | GITIGNORED | LLM inference for chatbot |
| Backend URL | `.env.local` | GITIGNORED | Phase II API calls |
| Better Auth Secret | `.env.local` | GITIGNORED | JWT verification |
| Agent Temperatures | `.env.local` | GITIGNORED | Agent behavior tuning |

---

## File Structure

```
project-root/
├── .env.example          # Template (COMMITTED to git)
├── .env.local            # Actual values (GITIGNORED)
├── .env                   # Legacy/general env
├── backend/
│   ├── .env.example      # Backend template
│   └── .env              # Backend actual (GITIGNORED)
├── frontend/
│   ├── .env.example      # Frontend template
│   └── .env              # Frontend actual (GITIGNORED)
└── docs/
    └── CREDENTIALS-GUIDE.md  # This file
```

---

## 1. Cohere API Key

### What is it?
API key for authenticating with Cohere's LLM service. Used by all AI agents for natural language processing.

### Where to get it?
1. Go to https://dashboard.cohere.com/
2. Sign in or create account
3. Navigate to API Keys section
4. Copy your API key

### Where it's saved:

**File: `.env.local` (root directory)**
```bash
COHERE_API_KEY=your_cohere_api_key_here
```

### How it's used in code:
```python
import os
from cohere import Client

cohere_client = Client(api_key=os.getenv("COHERE_API_KEY"))
```

### Security Note:
- NEVER commit this key to git
- NEVER expose in frontend/client-side code
- Rotate key if accidentally exposed

---

## 2. Backend API URL

### What is it?
The deployed Phase II FastAPI backend URL. All task CRUD operations go through this endpoint.

### Current Value:
```
https://syedfaizanmustafa-q4-hackathon-02-phase-ii.hf.space
```

### Where it's saved:

**File: `.env.local` (root directory)**
```bash
BACKEND_API_URL=https://syedfaizanmustafa-q4-hackathon-02-phase-ii.hf.space
```

### How it's used in code:
```python
import os
import httpx

backend_url = os.getenv("BACKEND_API_URL")

# Example: Get user's tasks
async def get_tasks(user_id: str, token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{backend_url}/api/{user_id}/tasks",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

### API Endpoints Available:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List all tasks |
| POST | `/api/{user_id}/tasks` | Create new task |
| GET | `/api/{user_id}/tasks/{task_id}` | Get single task |
| PUT | `/api/{user_id}/tasks/{task_id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{task_id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{task_id}` | Partial update |

---

## 3. Cohere Model Selection

### What is it?
Specifies which Cohere model to use for LLM inference.

### Options:
| Model | Description | Use Case |
|-------|-------------|----------|
| `command-r-plus` | Best quality, more expensive | Production, complex tasks |
| `command-r` | Faster, cheaper | Development, simple tasks |

### Where it's saved:

**File: `.env.local` (root directory)**
```bash
COHERE_MODEL=command-r-plus
```

### How it's used in code:
```python
import os
from cohere import Client

client = Client(api_key=os.getenv("COHERE_API_KEY"))
model = os.getenv("COHERE_MODEL", "command-r-plus")

response = client.chat(
    model=model,
    message="Hello, how can I help you?"
)
```

---

## 4. Agent Configuration

### What are these?
Temperature and token settings that control agent behavior.

### Where they're saved:

**File: `.env.local` (root directory)**
```bash
# Temperature: Lower = more deterministic, Higher = more creative
AGENT_INTENT_TEMPERATURE=0.3    # For intent-analyzer (needs accuracy)
AGENT_RESPONSE_TEMPERATURE=0.7  # For response-composer (needs naturalness)

# Max tokens per response
AGENT_MAX_TOKENS=1024
```

### How they're used:

```python
import os

# Intent Analyzer - needs precise, deterministic output
intent_temp = float(os.getenv("AGENT_INTENT_TEMPERATURE", "0.3"))

# Response Composer - needs natural, varied responses
response_temp = float(os.getenv("AGENT_RESPONSE_TEMPERATURE", "0.7"))

# Max tokens
max_tokens = int(os.getenv("AGENT_MAX_TOKENS", "1024"))
```

---

## 5. Better Auth Secret

### What is it?
Shared secret between frontend and backend for JWT verification. MUST be identical across all services.

### Where it's saved:

**File: `.env.local` (root directory)**
```bash
BETTER_AUTH_SECRET=<your-secret-here>
```

**Also in:**
- `frontend/.env` (for Better Auth client)
- `backend/.env` (for JWT verification)

### Important:
All three locations MUST have the SAME value!

---

## Setup Checklist

### First Time Setup:

1. **Copy template file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in values in `.env.local`:**
   ```bash
   # Required for Phase III
   COHERE_API_KEY=your_cohere_api_key_here
   BACKEND_API_URL=https://syedfaizanmustafa-q4-hackathon-02-phase-ii.hf.space
   COHERE_MODEL=command-r-plus

   # Agent configuration
   AGENT_INTENT_TEMPERATURE=0.3
   AGENT_RESPONSE_TEMPERATURE=0.7
   AGENT_MAX_TOKENS=1024

   # Auth (get from existing setup)
   BETTER_AUTH_SECRET=<copy-from-frontend-env>
   ```

3. **Verify .gitignore includes:**
   ```
   .env.local
   ```

4. **Test configuration:**
   ```python
   # test_config.py
   import os
   from dotenv import load_dotenv

   load_dotenv('.env.local')

   required_vars = [
       'COHERE_API_KEY',
       'BACKEND_API_URL',
       'COHERE_MODEL'
   ]

   for var in required_vars:
       value = os.getenv(var)
       if value:
           print(f"✅ {var}: {'*' * 10}...{value[-4:]}")
       else:
           print(f"❌ {var}: NOT SET")
   ```

---

## Troubleshooting

### "COHERE_API_KEY not found"
- Check `.env.local` exists in root directory
- Verify no spaces around `=` in env file
- Ensure `load_dotenv('.env.local')` is called

### "Backend API returns 401"
- Verify `BETTER_AUTH_SECRET` matches frontend/backend
- Check JWT token is valid and not expired
- Ensure correct `user_id` in API path

### "Model not found"
- Check `COHERE_MODEL` value is valid
- Options: `command-r-plus`, `command-r`

---

## Security Best Practices

1. **Never commit credentials** - Always use `.env.local` (gitignored)
2. **Rotate keys regularly** - Especially if team members leave
3. **Use different keys per environment** - Dev vs Staging vs Production
4. **Limit API key permissions** - Only grant necessary access
5. **Monitor API usage** - Watch for unusual patterns

---

**Last Updated**: 2026-02-03
**Author**: AI Assistant
**Version**: 1.0.0
