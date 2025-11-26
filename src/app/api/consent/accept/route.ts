import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/consent";

export async function POST(req: NextRequest) {
  try {
    const forwardedProto = req.headers.get?.('x-forwarded-proto') || req.headers.get?.('x-forwarded-protocol');
    const isHttps = forwardedProto ? String(forwardedProto).split(',')[0].trim() === 'https' : false;
    const secureFlag = process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' || isHttps;

    const res = NextResponse.json({ consent: true }, { status: 200 });

    try {
      res.cookies.set(COOKIE_NAME, 'true', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        secure: secureFlag,
      });
    } catch (e) {
      console.error('Failed to set consent cookie in accept route', e);
    }

    return res;
  } catch (err) {
    console.error('Error in consent accept route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
