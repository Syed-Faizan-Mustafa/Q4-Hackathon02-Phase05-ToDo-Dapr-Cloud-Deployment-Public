import { auth } from '@/lib/auth-server';
import { toNextJsHandler } from 'better-auth/next-js';

// Export handlers for all HTTP methods
// Better Auth handles: signup, signin, signout, session, etc.
const handler = toNextJsHandler(auth);

export const GET = handler.GET;
export const POST = handler.POST;
