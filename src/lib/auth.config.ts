import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  // Required when running behind a reverse proxy (Railway, Fly, Render, etc.),
  // where the request host is the platform-assigned domain rather than a value
  // Auth.js can infer. Without this, every auth request fails with UntrustedHost.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";
      const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (!isLoggedIn && !isLoginPage) return false;
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      const role = auth?.user?.role;
      const path = request.nextUrl.pathname;

      if (
        path.startsWith("/admin") &&
        role !== "ADMINISTRATOR" &&
        role !== "SUPERADMIN"
      ) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      if (
        path.startsWith("/supervisor") &&
        role !== "SUPERVISOR" &&
        role !== "ADMINISTRATOR" &&
        role !== "SUPERADMIN"
      ) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.teamId = user.teamId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as
        | "EMPLOYEE"
        | "SUPERVISOR"
        | "ADMINISTRATOR"
        | "SUPERADMIN";
      session.user.teamId = token.teamId as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
