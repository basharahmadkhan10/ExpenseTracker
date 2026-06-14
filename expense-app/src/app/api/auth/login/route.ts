import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const user = await prisma.user.findFirst({
      where: {
        name: trimmedName,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, name: user.name });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/',
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
