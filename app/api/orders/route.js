import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
function clean(v, max = 500) { return String(v ?? '').trim().slice(0, max); }
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const customerName = clean(body.customerName, 100), phone = clean(body.phone, 30), email = clean(body.email, 120), address = clean(body.address, 300), city = clean(body.city, 80), note = clean(body.note, 300);
  const deliveryFee = Math.max(0, Number(body.deliveryFee || 0));
  const deliveryZone = clean(body.deliveryZone || 'Manual', 100);
  const latitude = body.latitude == null ? null : Number(body.latitude);
  const longitude = body.longitude == null ? null : Number(body.longitude);
  const paymentMethod = ['OPAY','MONIEPOINT'].includes(body.paymentMethod) ? body.paymentMethod : 'OPAY';
  const paymentProof = typeof body.paymentProof === 'string' && body.paymentProof.startsWith('data:image/') && body.paymentProof.length <= 4_000_000 ? body.paymentProof : null;
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const currentUser = await getCurrentUser(request);
  if (!customerName || !phone || !address || !city || !rawItems.length) return NextResponse.json({ error: 'Name, phone, address, city and at least one item are required.' }, { status: 400 });
  const ids = [...new Set(rawItems.map(x => String(x.productId || '')))].filter(Boolean);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map(p => [p.id, p]));
  const items = [];
  for (const raw of rawItems) {
    const product = byId.get(String(raw.productId));
    const quantity = Math.max(1, Math.min(20, Number(raw.quantity || 1)));
    if (!product || product.price == null) continue;
    if (product.stock < quantity) return NextResponse.json({ error: `${product.name} does not have enough stock.` }, { status: 400 });
    items.push({ productId: product.id, name: product.name, price: product.price, quantity });
  }
  if (!items.length) return NextResponse.json({ error: 'Your cart has no priced products available for checkout.' }, { status: 400 });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0), total = subtotal + deliveryFee;
  let order;
  try {
    order = await prisma.$transaction(async tx => {
      for (const item of items) {
        const result = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (result.count !== 1) throw new Error(`STOCK:${item.name}`);
      }
      return tx.order.create({ data: { userId: currentUser?.id || null, customerName, phone, email, address, city, note, subtotal, deliveryFee, total, paymentMethod, paymentProof, deliveryZone, latitude: Number.isFinite(latitude) ? latitude : null, longitude: Number.isFinite(longitude) ? longitude : null, items: { create: items } }, include: { items: true } });
    });
  } catch (err) {
    if (String(err.message).startsWith('STOCK:')) return NextResponse.json({ error: 'One of the products just sold out. Please refresh your cart.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not create the order.' }, { status: 500 });
  }
  const payments = {
    OPAY: { provider: 'OPay', accountName: process.env.OPAY_ACCOUNT_NAME || 'Oyindamola Awofemi', accountNumber: process.env.OPAY_ACCOUNT_NUMBER || '8120169622' },
    MONIEPOINT: { provider: 'Moniepoint', accountName: process.env.MONIEPOINT_ACCOUNT_NAME || 'Omotayo Ajayi', accountNumber: process.env.MONIEPOINT_ACCOUNT_NUMBER || '5955941366' }
  };
  return NextResponse.json({ order, payment: payments[paymentMethod] }, { status: 201 });
}
