import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User, Account } from "@/lib/models";
import type { Role } from "@/lib/models";

const VALID_ROLES: Role[] = ["DRIVER", "MECHANIC", "ADMIN"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth — create/link user in MongoDB
      if (account?.provider === "google") {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: "DRIVER" as Role,
          });
        }
        await Account.findOneAndUpdate(
          { provider: "google", providerAccountId: account.providerAccountId },
          {
            userId: dbUser._id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            expires_at: account.expires_at,
            id_token: account.id_token,
            scope: account.scope,
            token_type: account.token_type,
          },
          { upsert: true, new: true }
        );
      }
      return true;
    },

    async jwt({ token, user, account }) {
      const ONE_HOUR = 3600000;
      const lastCheck = (token.lastRoleCheck as number) ?? 0;
      const needsDbLookup = !!user || !token.role || (Date.now() - lastCheck > ONE_HOUR);

      // Google OAuth users always need a DB lookup (created with default DRIVER role)
      const isGoogleOAuth = account?.provider === "google" && !!user;

      if (needsDbLookup || isGoogleOAuth) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email }).select("_id role").lean();
          if (dbUser) {
            token.id = String(dbUser._id);
            token.role = VALID_ROLES.includes(dbUser.role as Role) ? dbUser.role : "DRIVER";
          } else if (user) {
            token.id = user.id;
            token.role = "DRIVER";
          }
          token.lastRoleCheck = Date.now();
        } catch {
          if (user) {
            token.id = user.id;
          }
          if (!token.role) token.role = "DRIVER";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        const rawRole = token.role as string;
        session.user.role = VALID_ROLES.includes(rawRole as Role)
          ? (rawRole as Role)
          : "DRIVER";
      }
      return session;
    },
  },
});
