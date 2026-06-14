import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Session user check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
