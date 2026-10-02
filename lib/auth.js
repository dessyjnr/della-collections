import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'change-this-secret-before-production');
const cookieName = 'dellas_admin';

export async function createAdminToken() {
  return new SignJWT({ role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function isAdmin(request) {
  try {
    const token = request.cookies.get(cookieName)?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'ADMIN';
  } catch { return false; }
}

export { cookieName };
