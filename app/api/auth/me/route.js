import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
export async function GET(request) { return NextResponse.json({ authenticated: await isAdmin(request) }); }
