import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function GET(request){
  const auth=await isAdmin(request); if(!auth) return NextResponse.json({error:'Unauthorized'},{status:401});
  const orders=await prisma.order.findMany({include:{items:true},orderBy:{createdAt:'desc'}});
  return NextResponse.json(orders);
}
export async function PATCH(request){
  const auth=await isAdmin(request); if(!auth) return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await request.json().catch(()=>({}));
  const allowed=['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'];
  if(!body.id || !allowed.includes(body.status)) return NextResponse.json({error:'Invalid order status.'},{status:400});
  const order=await prisma.order.update({where:{id:String(body.id)},data:{status:body.status}});
  return NextResponse.json(order);
}
