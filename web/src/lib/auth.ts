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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.providerId = user.providerId;
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
