import { NextResponse } from 'next/server';
import { createAdminToken, cookieName } from '@/lib/auth';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const expectedEmail = String(process.env.ADMIN_EMAIL || 'admin@dellascloset.com').toLowerCase();
  const expectedPassword = String(process.env.ADMIN_PASSWORD || 'change-me');
  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
  const token = await createAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}
