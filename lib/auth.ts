import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const tutor = await prisma.tutor.findUnique({ where: { email } });
        if (!tutor) return null;

        const valid = await bcrypt.compare(password, tutor.passwordHash);
        if (!valid) return null;

        return { id: tutor.id, email: tutor.email, name: tutor.name };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.tutorId = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.id = token.tutorId as string;
      return session;
    },
  },
});
