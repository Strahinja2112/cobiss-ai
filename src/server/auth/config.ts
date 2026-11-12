import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "~/env";

export const authConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    signIn: ({ account, profile }) =>
      account?.provider === "google" &&
      profile?.email_verified === true &&
      profile.email?.toLowerCase() === env.ALLOWED_GOOGLE_EMAIL.toLowerCase(),
  },
} satisfies NextAuthConfig;
