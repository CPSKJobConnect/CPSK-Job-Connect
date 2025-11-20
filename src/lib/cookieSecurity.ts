export function enforceCookieSecurity(res: Response): Response {
	if (!res || !res.headers || typeof (res.headers as any).entries !== 'function') return res;
	const entries: [string, string | string[] | undefined][] = Array.from(
		(res.headers as any).entries() as Iterable<[string, string | string[] | undefined]>
	);
	const setCookieVals: string[] = [];
	for (const [k, v] of entries) {
		if (String(k).toLowerCase() === 'set-cookie' && v) {
			if (Array.isArray(v)) {
				setCookieVals.push(...v.map(String));
			} else {
				setCookieVals.push(...String(v).split('\n').map(s => s.trim()).filter(Boolean));
			}
		}
	}

	if (setCookieVals.length === 0) return res;
	const newHeaders = new Headers(res.headers as any);
	newHeaders.delete('set-cookie');

	for (const cookieHeader of setCookieVals) {
		const pair = (cookieHeader.split(';')[0] || '').trim();
		const eq = pair.indexOf('=');
		if (eq <= 0) {
			throw new Error(`Invalid Set-Cookie header: ${cookieHeader.slice(0, 200)}`);
		}
		const cookieName = pair.slice(0, eq).trim();
		const value = pair.slice(eq + 1).trim();
		const rest = cookieHeader.slice(pair.length) || '';

		const hasSecure = /(^|;)\s*secure\b/i.test(rest);
		let attrs = rest;
		if (!hasSecure) {
			attrs = (attrs ? attrs + '; ' : '; ') + 'Secure';
		}

		// Do NOT rename cookie names. Only enforce security attributes.
		const newHeader = `${cookieName}=${value}${attrs}`;
		newHeaders.append('Set-Cookie', newHeader);
	}

	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: newHeaders,
	});
}

export default enforceCookieSecurity;
