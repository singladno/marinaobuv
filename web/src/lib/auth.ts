import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/server/db';
import { compare } from 'bcryptjs';
import { env } from '@/lib/env';
import { normalizePhoneToE164 } from '@/lib/server/sms';
import { extractNormalizedPhone } from '@/lib/utils/whatsapp-phone-extractor';

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    providerId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      providerId?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    providerId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  // adapter: PrismaAdapter(prisma), // Temporarily disabled due to version compatibility issues
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        phone: { label: 'Phone', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { email, password, phone } = credentials;

        // Handle email/password login
        if (email && password) {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { provider: true },
          });

          if (!user || !user.passwordHash) return null;

          const isValid = await compare(password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            providerId: user.providerId,
          };
        }

        // Handle phone/password login (for existing users)
        if (phone && password) {
          // Normalize phone number to handle different formats
          const normalizedPhone = normalizePhoneToE164(phone);

          const user = await prisma.user.findUnique({
            where: { phone: normalizedPhone },
            include: { provider: true },
          });

          if (!user || !user.passwordHash) return null;

          const isValid = await compare(password, user.passwordHash);
          if (!isValid) return null;

          // Check if user matches admin phone and update role if needed
          let updatedUser = user;
          if (
            env.ADMIN_PHONE &&
            env.ADMIN_PHONE === normalizedPhone &&
            user.role !== 'ADMIN'
          ) {
            updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' },
              include: { provider: true },
            });
          }
          // If existing user doesn't have a provider but there's a provider with this phone, connect them
          else if (!user.providerId) {
            // First try exact match with normalized phone
            let provider = await prisma.provider.findFirst({
              where: { phone: normalizedPhone },
            });

            // If no exact match, try to find provider by WhatsApp ID format
            if (!provider) {
              const allProviders = await prisma.provider.findMany({
                where: { phone: { not: null } },
              });

              provider =
                allProviders.find(p => {
                  if (!p.phone) return false;
                  const extractedPhone = extractNormalizedPhone(p.phone);
                  return extractedPhone === normalizedPhone;
                }) || null;
            }

            if (provider && user.role !== 'ADMIN') {
              updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                  role: 'PROVIDER',
                  providerId: provider.id,
                },
                include: { provider: true },
              });
            }
          }

          return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            providerId: updatedUser.providerId,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // User exists, update their name if it's different and mark email as verified
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                emailVerified: new Date(),
              },
            });

            // Create or update the Account record to link Google OAuth
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                userId: existingUser.id,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
              create: {
                userId: existingUser.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            console.log(
              `✅ Linked Google OAuth to existing user: ${user.email}`
            );
          } else {
            // Create new user with default role
            let role = 'CLIENT';

            // Check if this is an admin email
            if (env.ADMIN_EMAIL && user.email === env.ADMIN_EMAIL) {
              role = 'ADMIN';
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                role: role as any, // Cast to avoid type issues
                emailVerified: new Date(),
              },
            });

            // Create the Account record to link Google OAuth
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            console.log(`✅ Created new user from Google OAuth: ${user.email}`);
          }
        } catch (error) {
          console.error('Error handling Google OAuth sign-in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Seed token with user info on initial sign-in
      if (user) {
        token.role = user.role;
        token.providerId = user.providerId;
        // If user has an id and it's from credentials (not OAuth), use it directly
        // For OAuth, user.id is the provider ID, not the database User ID, so we'll look it up
        if (user.id && account?.provider !== 'google') {
          token.sub = user.id;
        }
        // Ensure email is in token for OAuth users
        if (user.email && !token.email) {
          token.email = user.email;
        }
      }

      // Always refresh role/providerId from DB so role changes apply without relogin
      try {
        let dbUser = null;

        // Strategy: Try multiple lookup methods
        // 1. If we have email, prefer email lookup (works for OAuth users)
        // 2. If email lookup fails, try token.sub (for credentials users)
        // 3. If we have account info on initial OAuth sign-in, use Account table

        // For OAuth users, NextAuth may have set token.sub to the provider ID.
        // We'll override it once we find the correct user, but for now, prefer email lookup.
        // First, try email lookup (most reliable for OAuth users)
        if (token.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, providerId: true },
          });
        }

        // If not found and we have token.sub, try looking up by ID (for credentials users)
        if (!dbUser && token.sub) {
          dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { id: true, role: true, providerId: true },
          });
        }

        // If still not found and we have account info (OAuth initial sign-in), look up via Account table
        if (!dbUser && account?.providerAccountId && account?.provider) {
          const accountRecord = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            include: {
              user: {
                select: { id: true, role: true, providerId: true },
              },
            },
          });

          if (accountRecord?.user) {
            dbUser = accountRecord.user;
          }
        }

        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.providerId = dbUser.providerId;
        }
      } catch (error) {
        console.error('Error refreshing JWT user role from database:', error);
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.providerId = token.providerId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If url is relative, make it absolute with baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // If url is absolute, use it as is
      return url;
    },
  },
  pages: {
    signIn: '/login',
  },
};

// Helper function for role-based access control
export async function requireRole(
  req: Request,
  roles: string[]
): Promise<{ user: any; role: string }> {
  const { getServerSession } = await import('next-auth/next');
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!roles.includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return {
    user: session.user,
    role: session.user.role,
  };
}
