import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getPrisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user user:email",
        },
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
    async signIn({ account, user, profile }) {
      if (
        account?.provider !== "github" ||
        !account.providerAccountId ||
        !account.access_token
      ) {
        return false;
      }

      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${account.access_token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (!emailResponse.ok) {
        throw new Error("Unable to retrieve a verified primary GitHub email.");
      }

      const emails = (await emailResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const email = emails
        .find((entry) => entry.primary && entry.verified)
        ?.email.trim()
        .toLowerCase();
      if (!email) {
        return false;
      }

      const prisma = getPrisma();
      const githubUsername =
        typeof profile?.login === "string" ? profile.login.trim().toLowerCase() : null;
      const linkedUser = await prisma.user.findUnique({
        where: { githubId: account.providerAccountId },
      });

      if (linkedUser) {
        if (githubUsername && linkedUser.githubUsername !== githubUsername) {
          await prisma.user.update({
            where: { id: linkedUser.id },
            data: { githubUsername },
          });
        }
        return true;
      }

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return false;
      }

      await prisma.user.create({
        data: {
          githubId: account.providerAccountId,
          githubUsername,
          name: user.name?.trim() || email.split("@")[0],
          email,
          avatar: user.image,
        },
      });

      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "github") {
        const user = await getPrisma().user.findUnique({
          where: { githubId: account.providerAccountId },
          select: { id: true },
        });

        if (!user) {
          throw new Error("GitHub account has no persisted application user.");
        }

        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user || typeof token.userId !== "string") {
        throw new Error("Authenticated session is missing its persisted user identity.");
      }

      session.user.id = token.userId;
      return session;
    },
    authorized({ auth }) {
      return Boolean(auth?.user?.id);
    },
  },
});
