import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
