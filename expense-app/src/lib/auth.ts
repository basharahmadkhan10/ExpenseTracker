import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-this-in-production';

/**
 * Hashes a plaintext password using bcrypt.
 * @param password The raw password string
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param password The raw password
 * @param hash The stored hash
 * @returns Boolean indicating if the password is correct
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; name: string };
  } catch (error) {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true },
    });
    return user;
  } catch (error) {
    return null;
  }
}
