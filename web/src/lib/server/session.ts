import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const cookieName = 'mo_session';
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-secret-change-me'
);

export type SessionPayload = {
  userId: string;
  role: string;
  providerId?: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export function clearSession() {
  cookies().delete(cookieName);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await Promise.resolve(cookies());
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
