import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
export async function GET(request){const user=await getCurrentUser(request);return NextResponse.json({authenticated:Boolean(user),user:user?{id:user.id,name:user.name,email:user.email,phone:user.phone,role:user.role}:null});}