import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
export async function POST(request){
 const user=await getCurrentUser(request);if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const b=await request.json().catch(()=>({}));const current=String(b.currentPassword||''),next=String(b.newPassword||'');
 if(next.length<8)return NextResponse.json({error:'New password must be at least 8 characters.'},{status:400});
 if(!verifyPassword(current,user.passwordHash))return NextResponse.json({error:'Current password is incorrect.'},{status:401});
 await prisma.user.update({where:{id:user.id},data:{passwordHash:hashPassword(next)}});return NextResponse.json({ok:true});
}