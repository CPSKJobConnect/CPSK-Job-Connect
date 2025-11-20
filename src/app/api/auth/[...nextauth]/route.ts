/* istanbul ignore file */
/* istanbul ignore file */
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withResponseCookieSizeGuard } from '@/lib/cookieGuard';

// Wrap the NextAuth App Router handler so any `Set-Cookie` headers emitted
// by NextAuth are validated against the 4096-byte name+value requirement.
const rawHandler = NextAuth(authOptions);
const handler = withResponseCookieSizeGuard(rawHandler as any);
export { handler as GET, handler as POST };
