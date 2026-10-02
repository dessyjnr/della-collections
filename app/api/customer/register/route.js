import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCustomerToken, hashPassword } from '@/lib/auth';
export async function POST(request){
 const b=await request.json().catch(()=>({})); const name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),phone=String(b.phone||'').trim(),password=String(b.password||'');
 if(name.length<2||!email||password.length<8)return NextResponse.json({error:'Name, valid email and password of at least 8 characters are required.'},{status:400});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:'Enter a valid email address.'},{status:400});
 if(await prisma.user.findUnique({where:{email}}))return NextResponse.json({error:'An account with this email already exists.'},{status:409});
 const user=await prisma.user.create({data:{name,email,phone:phone||null,passwordHash:hashPassword(password),role:'CUSTOMER'}});
 const token=await createCustomerToken(user); const response=NextResponse.json({ok:true,user:{name:user.name,email:user.email}});
 response.cookies.set('dellas_customer',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*7}); return response;
}