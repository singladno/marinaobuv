// This file is deprecated - use NextAuth instead
// Keeping this stub to prevent import errors while migrating API routes

export type SessionPayload = {
  userId: string;
  role: string;
  providerId?: string | null;
};

export async function getSession(): Promise<SessionPayload | null> {
  // Always return null to force migration to NextAuth
  return null;
}

export async function createSession() {
  // Deprecated - use NextAuth signIn instead
  throw new Error(
    'Custom session system is deprecated. Use NextAuth signIn instead.'
  );
}

export async function clearSession() {
  // Deprecated - use NextAuth signOut instead
  throw new Error(
    'Custom session system is deprecated. Use NextAuth signOut instead.'
  );
}
