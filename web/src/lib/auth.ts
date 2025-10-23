import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/server/db';
import { compare } from 'bcryptjs';
import { env } from '@/lib/env';

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
          const user = await prisma.user.findUnique({
            where: { phone },
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
      console.log('🔍 NEXTAUTH REDIRECT DEBUG: url:', url);
      console.log('🔍 NEXTAUTH REDIRECT DEBUG: baseUrl:', baseUrl);
      console.log(
        '🔍 NEXTAUTH REDIRECT DEBUG: NEXTAUTH_URL:',
        process.env.NEXTAUTH_URL
      );
      console.log(
        '🔍 NEXTAUTH REDIRECT DEBUG: NEXT_PUBLIC_SITE_URL:',
        process.env.NEXT_PUBLIC_SITE_URL
      );

      // If url is relative, make it absolute with baseUrl
      if (url.startsWith('/')) {
        const fullUrl = `${baseUrl}${url}`;
        console.log(
          '🔍 NEXTAUTH REDIRECT DEBUG: Constructed fullUrl:',
          fullUrl
        );
        return fullUrl;
      }

      // If url is absolute, use it as is
      console.log('🔍 NEXTAUTH REDIRECT DEBUG: Using absolute url:', url);
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
