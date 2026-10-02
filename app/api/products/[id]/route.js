import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function DELETE(request, { params }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request, { params }) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const product = await prisma.product.update({ where: { id: params.id }, data: {
    name: body.name, category: body.category, image: body.image,
    price: body.price == null || body.price === '' ? null : Number(body.price),
    stock: Number(body.stock || 0), sizes: body.sizes || '', description: body.description || ''
  }});
  return NextResponse.json(product);
}
