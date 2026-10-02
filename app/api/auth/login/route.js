import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminToken, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user && email === String(process.env.ADMIN_EMAIL || 'admin@dellascloset.com').toLowerCase()) {
    const legacyPassword = String(process.env.ADMIN_PASSWORD || 'change-me');
    if (password !== legacyPassword) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    user = await prisma.user.create({ data: { name: 'Della’s Closet Admin', email, passwordHash: hashPassword(password), role: 'ADMIN' } });
  }

  if (!user || user.role !== 'ADMIN' || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createAdminToken(user);
  const response = NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
  response.cookies.set('dellas_admin', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}
