import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCustomerToken, verifyPassword } from '@/lib/auth';
export async function POST(request){
 const b=await request.json().catch(()=>({})); const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');
 const user=await prisma.user.findUnique({where:{email}});
 if(!user||user.role!=='CUSTOMER'||!verifyPassword(password,user.passwordHash))return NextResponse.json({error:'Invalid email or password.'},{status:401});
 const token=await createCustomerToken(user); const response=NextResponse.json({ok:true,user:{name:user.name,email:user.email}});
 response.cookies.set('dellas_customer',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*7}); return response;
}