import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
export async function GET(request){
 const user=await getCurrentUser(request);if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 return NextResponse.json(await prisma.order.findMany({where:{userId:user.id},include:{items:true},orderBy:{createdAt:'desc'}}));
}