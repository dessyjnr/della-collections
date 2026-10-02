import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/auth';
export async function GET(request) {
  const user = await getAdmin(request);
  return NextResponse.json({ authenticated: Boolean(user), user: user ? { name: user.name, email: user.email, role: user.role } : null });
}
