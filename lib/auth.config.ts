import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — no Prisma, no bcrypt. Used by middleware (proxy.ts).
// The full config in auth.ts extends this with the Credentials provider.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) { token.tutorId = user.id; token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false; }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) { session.user.id = token.tutorId as string; session.user.isAdmin = (token.isAdmin ?? false) as boolean; }
      return session;
    },
  },
};
