import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "mock-github",
      name: "GitHub (Demo)",
      credentials: {
        email: { label: "Email", type: "text" },
        role: { label: "Role", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const prisma = getPrisma();
        const rawEmail =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const email = rawEmail || "alex@microsplit.demo";
        const customName =
          typeof credentials?.name === "string" && credentials.name.trim()
            ? credentials.name.trim()
            : null;
        const fallbackName =
          email
            .split("@")[0]
            .split(/[._-]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ") || "Demo User";
        const name = customName || fallbackName;
        const role =
          typeof credentials?.role === "string" && credentials.role.trim()
            ? credentials.role.trim()
            : "owner";

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              githubUsername: email.split("@")[0].toLowerCase(),
              role,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
    authorized({ auth }) {
      return Boolean(auth?.user?.id);
    },
  },
});
