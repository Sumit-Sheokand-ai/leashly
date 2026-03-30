import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkAuthRateLimit, resetAuthRateLimit } from "./auth-rate-limit";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // refresh token every 24h
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Brute-force protection per email
        const identifier = credentials.email.toLowerCase().trim();
        const rateCheck = checkAuthRateLimit(identifier);
        if (!rateCheck.allowed) {
          throw new Error(
            `Too many attempts. Try again in ${Math.ceil((rateCheck.retryAfterMs ?? 0) / 60000)} minutes.`
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: identifier },
        });

        if (!user) {
          // Don't reveal whether email exists — same timing as a real check
          await bcrypt.compare(credentials.password, "$2a$12$placeholder.hash.to.prevent.timing.attacks");
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) return null;

        // Successful login — clear failed attempts
        resetAuthRateLimit(identifier);

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};
