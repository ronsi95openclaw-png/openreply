import NextAuth, { type NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser, getPrimaryWorkspace } from "@/lib/workspace";
import { isEmailAllowedToSignIn } from "@/lib/env";
import { timingSafeEqual } from "node:crypto";
import { getSessionUserId } from "@/lib/auth/session";

type AdapterPrismaClient = Parameters<typeof PrismaAdapter>[0];

const emailFrom = process.env.EMAIL_FROM ?? "OpenReply <login@example.com>";
// Setting EMAIL_SERVER switches magic links to your own SMTP server, for
// self-hosters who do not want a third-party mail service. Resend stays the
// default, so an existing deployment is unaffected.
const smtpServer = process.env.EMAIL_SERVER;
const localAdminEmail = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
const localAdminPassword = process.env.LOCAL_ADMIN_PASSWORD;

/**
 * A local-only dashboard can use one operator login and does not need Resend,
 * SMTP, or any other email service. It is enabled only when both variables
 * are supplied, so regular self-hosted deployments keep their magic-link flow.
 */
export const LOCAL_LOGIN_ENABLED = Boolean(localAdminEmail && localAdminPassword);

/**
 * Provider id the login form has to sign in with. It differs per transport,
 * so it is derived here rather than hardcoded at the call site.
 */
export const EMAIL_PROVIDER_ID = smtpServer ? "nodemailer" : "resend";

function passwordsMatch(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  return (
    inputBuffer.length === expectedBuffer.length &&
    timingSafeEqual(inputBuffer, expectedBuffer)
  );
}

export const authConfig = {
  adapter: PrismaAdapter(prisma as unknown as AdapterPrismaClient),
  providers: LOCAL_LOGIN_ENABLED
    ? [
        Credentials({
          id: "local-admin",
          name: "Local administrator",
          credentials: {
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            const password = String(credentials?.password ?? "");
            if (!localAdminEmail || !localAdminPassword) return null;
            if (!passwordsMatch(password, localAdminPassword)) return null;

            const user = await prisma.user.upsert({
              where: { email: localAdminEmail },
              update: {},
              create: { email: localAdminEmail, name: "Local administrator" },
            });
            await ensureWorkspaceForUser(user.id, user.email);

            return { id: user.id, email: user.email, name: user.name };
          },
        }),
      ]
    : [
        smtpServer
          ? Nodemailer({ server: smtpServer, from: emailFrom })
          : Resend({
              apiKey: process.env.RESEND_API_KEY ?? "missing-resend-api-key",
              from: emailFrom,
            }),
      ],
  callbacks: {
    // Runs before the magic link is sent, so a blocked address never receives
    // one, and again when the link is verified.
    async signIn({ user }) {
      return isEmailAllowedToSignIn(user?.email);
    },
    async session({ session, user, token }) {
      if (session.user) {
        // Local administrator login uses Credentials + JWT sessions, where
        // Auth.js does not provide a database `user` on later requests.
        // Email-login deployments retain their existing database session.
        const userId = getSessionUserId(user?.id, token?.sub);
        if (userId) session.user.id = userId;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureWorkspaceForUser(user.id, user.email);
      }
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  session: {
    // Credentials providers require JWT sessions. Magic links keep the
    // original database-backed session behavior when local login is disabled.
    strategy: LOCAL_LOGIN_ENABLED ? "jwt" : "database",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const workspace = await getPrimaryWorkspace(userId);
  if (workspace) return workspace.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const createdWorkspace = await ensureWorkspaceForUser(userId, user?.email);
  return createdWorkspace.id;
}
