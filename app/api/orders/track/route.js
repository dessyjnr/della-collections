import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET(request){
 const token=new URL(request.url).searchParams.get('token');
 if(!token) return NextResponse.json({error:'Tracking token required.'},{status:400});
 const order=await prisma.order.findUnique({where:{trackingToken:token},select:{id:true,status:true,deliveryZone:true,createdAt:true,updatedAt:true,items:{select:{name:true,quantity:true,price:true}}}});
 if(!order) return NextResponse.json({error:'Order not found.'},{status:404});
 return NextResponse.json(order);
}
