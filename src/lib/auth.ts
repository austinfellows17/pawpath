import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/constants";
import {
  OAUTH_SIGNUP_ROLE_COOKIE,
  OAUTH_TERMS_COOKIE,
  isGoogleAuthConfigured,
} from "@/lib/google-auth";

function buildProviders() {
  const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;

        if (user.isSuspended) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ];

  if (isGoogleAuthConfigured()) {
    providers.unshift(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: buildProviders(),
  callbacks: {
    async signIn({ user, account }) {
      if (user.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { isSuspended: true },
        });

        if (dbUser?.isSuspended) {
          return "/login?error=AccountSuspended";
        }
      }

      if (account?.provider !== "google" || !user.id) return true;

      const cookieStore = await cookies();
      const signupRole = cookieStore.get(OAUTH_SIGNUP_ROLE_COOKIE)?.value;
      const termsAccepted = cookieStore.get(OAUTH_TERMS_COOKIE)?.value === "1";

      cookieStore.delete(OAUTH_SIGNUP_ROLE_COOKIE);
      cookieStore.delete(OAUTH_TERMS_COOKIE);

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { termsAcceptedAt: true },
      });

      if (!dbUser?.termsAcceptedAt) {
        const role =
          signupRole === "WALKER" ? UserRole.WALKER : UserRole.OWNER;

        await db.user.update({
          where: { id: user.id },
          data: {
            role,
            termsAcceptedAt: termsAccepted ? new Date() : null,
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user?.id || account?.provider === "google") {
        const dbUser = await db.user.findUnique({
          where: { id: (user?.id ?? token.id) as string },
          select: { role: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
        }
      } else if (user) {
        token.role = (user as SessionUser).role ?? UserRole.OWNER;
      }

      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as SessionUser["role"];
      }
      return session;
    },
  },
};
