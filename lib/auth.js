import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'change-this-secret-before-production');
const adminCookie = 'dellas_admin';
const customerCookie = 'dellas_customer';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split(':');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch { return false; }
}

async function createToken(user) {
  return new SignJWT({ sub: user.id, role: user.role, email: user.email })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
}

export async function createAdminToken(user) {
  return createToken(user || { id: 'legacy-admin', role: 'ADMIN', email: process.env.ADMIN_EMAIL || 'admin@dellascloset.com' });
}
export async function createCustomerToken(user) { return createToken(user); }

async function readUser(request, cookieName) {
  try {
    const token = request.cookies.get(cookieName)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return await prisma.user.findUnique({ where: { id: String(payload.sub) } });
  } catch { return null; }
}

export async function getCurrentUser(request) { return readUser(request, customerCookie); }
export async function getAdmin(request) {
  const user = await readUser(request, adminCookie);
  return user?.role === 'ADMIN' ? user : null;
}
export async function isAdmin(request) { return Boolean(await getAdmin(request)); }

export { adminCookie as cookieName, customerCookie };
