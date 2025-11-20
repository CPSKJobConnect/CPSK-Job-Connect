import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { withResponseCookieSizeGuard } from '@/lib/cookieGuard';
import enforceCookieSecurity from '@/lib/cookieSecurity';

const rawHandler = NextAuth(authOptions);
const handler = withResponseCookieSizeGuard(rawHandler as any);

async function securedHandler(req: any, ...rest: any[]) {
	const res = await handler(req, ...rest);
	try {
		const enforced = enforceCookieSecurity(res as Response);
		return enforced;
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Cookie enforcement failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export { securedHandler as GET, securedHandler as POST };
