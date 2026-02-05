# Quickstart Guide: Frontend - Phase II Todo App

**Branch**: `001-frontend-todo` | **Date**: 2026-01-09

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or pnpm package manager
- [ ] Backend API running (FastAPI on port 8000)
- [ ] Better Auth configured with shared secret

---

## 1. Project Setup

### Navigate to frontend directory

```bash
cd frontend
```

### Install dependencies

```bash
npm install
# or
pnpm install
```

### Required packages

The following packages are needed (add to package.json):

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "better-auth": "^1.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "framer-motion": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

---

## 2. Environment Configuration

### Create `.env.local` file

```bash
cp .env.example .env.local
```

### Required environment variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Better Auth Configuration
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-shared-secret-here

# Must match backend BETTER_AUTH_SECRET exactly!
```

> **Important**: The `BETTER_AUTH_SECRET` must be identical on both frontend and backend for JWT verification to work.

---

## 3. Tailwind CSS Setup

### Verify `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

### Verify `globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
body {
  @apply bg-gray-50 text-gray-900;
}
```

---

## 4. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will be available at: `http://localhost:3000`

---

## 5. Verification Checklist

### Auth Flow

1. Navigate to `http://localhost:3000/signup`
2. Create a new account with:
   - Valid email
   - Password: 8+ chars, 1 uppercase, 1 lowercase, 1 number
3. Verify redirect to `/tasks` after signup
4. Click logout and verify redirect to `/signin`
5. Sign in with created credentials
6. Verify redirect to `/tasks`

### Task Operations

1. On `/tasks`, verify empty state is displayed
2. Click "Add Task" button
3. Create task with title and optional description
4. Verify task appears in list
5. Click edit on task, modify title
6. Verify changes saved
7. Toggle task completion
8. Verify visual status change
9. Delete task with confirmation
10. Verify task removed

### Responsive Design

1. Test on desktop (1920px width)
2. Test on tablet (768px width)
3. Test on mobile (375px width)
4. Verify filter bar collapses on mobile
5. Verify single-column layout on mobile

---

## 6. Testing

### Run unit tests

```bash
npm run test
# or
pnpm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Test coverage

```bash
npm run test:coverage
```

---

## 7. Build for Production

```bash
npm run build
npm start
```

### Production checklist

- [ ] Environment variables set for production
- [ ] BETTER_AUTH_SECRET is secure and matches backend
- [ ] API_URL points to production backend
- [ ] CORS configured on backend for production origin

---

## 8. Common Issues

### JWT Token Not Attaching

- Verify Better Auth is properly initialized
- Check that API interceptor is set up in `lib/api.ts`
- Ensure session is established before API calls

### 401 Errors on Task Operations

- Verify user is logged in
- Check JWT token is not expired
- Confirm BETTER_AUTH_SECRET matches backend

### CORS Errors

- Backend must allow frontend origin
- Check `Access-Control-Allow-Origin` header
- Verify `Access-Control-Allow-Headers` includes `Authorization`

### Styles Not Loading

- Verify Tailwind content paths in config
- Run `npm run dev` to regenerate CSS
- Clear browser cache

---

## 9. Development Workflow

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Make changes to components
4. Verify in browser (hot reload enabled)
5. Run tests before committing
6. Follow Git branch conventions

---

## Next Steps

After quickstart verification:

1. Run `/sp.tasks` to generate implementation tasks
2. Follow task order for implementation
3. Mark tasks complete as you progress
4. Run tests after each phase
