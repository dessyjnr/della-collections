import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(request) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.image || !body.category) return NextResponse.json({ error: 'Name, category and image are required.' }, { status: 400 });
  const product = await prisma.product.create({ data: {
    name: String(body.name), category: String(body.category), image: String(body.image),
    price: body.price === '' || body.price == null ? null : Number(body.price),
    stock: body.stock === '' || body.stock == null ? 0 : Number(body.stock),
    sizes: String(body.sizes || ''), description: String(body.description || '')
  }});
  return NextResponse.json(product, { status: 201 });
}
