import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get session using Better Auth's API
async function getSession(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.session?.token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No session token found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.session.token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.session?.token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No session token found' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create task' },
      { status: 500 }
    );
  }
}
