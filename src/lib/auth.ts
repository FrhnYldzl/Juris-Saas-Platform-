import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

/**
 * Google OAuth allowlist.
 * Comma-separated domains (without @) via GOOGLE_ALLOWED_DOMAINS env.
 * The bootstrap admin email is always allowed.
 */
function isGoogleEmailAllowed(email: string): boolean {
  const lower = email.toLowerCase();
  const bootstrapAdmin = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  if (bootstrapAdmin && lower === bootstrapAdmin) return true;

  const defaults = ["jurishukuk.com", "juris.com.tr"];
  const extra = (process.env.GOOGLE_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  const domains = new Set([...defaults, ...extra]);

  const [, domain] = lower.split("@");
  return Boolean(domain && domains.has(domain));
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firmId: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    firmId: string;
    role: UserRole;
  }
}

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Auto-link Google identity to an existing user with the same email
            // (seeded admin, invited team members). Safe because we control
            // the allowlist in the signIn callback.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "E-posta & Şifre",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            role: true,
            firmId: true,
            active: true,
          },
        });

        if (!user || !user.passwordHash || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          firmId: user.firmId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google provider: enforce domain allowlist + auto-create a User row
      // attached to the firm (our schema requires firmId which the default
      // PrismaAdapter createUser doesn't know about).
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        if (!isGoogleEmailAllowed(email)) {
          // Redirect back to /login with an explicit error param
          return "/login?error=domain_not_allowed";
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          const firm = await prisma.firm.findFirst({ orderBy: { createdAt: "asc" } });
          if (!firm) return "/login?error=firm_not_ready";

          const isBootstrapAdmin =
            email === process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();

          await prisma.user.create({
            data: {
              email,
              name: user.name ?? email.split("@")[0],
              image: user.image ?? null,
              firmId: firm.id,
              role: isBootstrapAdmin ? "OWNER" : "ASSOCIATE",
              emailVerified: new Date(),
            },
          });
        } else if (!existing.active) {
          return "/login?error=account_disabled";
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Credentials.authorize() returns our User with firmId + role.
        // Google/OAuth returns only the basics — look up the tenant fields.
        const u = user as { id?: string; email?: string | null; firmId?: string; role?: UserRole };
        if (u.firmId && u.role) {
          token.id = u.id!;
          token.firmId = u.firmId;
          token.role = u.role;
        } else if (u.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: u.email.toLowerCase() },
            select: { id: true, firmId: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.firmId = dbUser.firmId;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.firmId = token.firmId;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
