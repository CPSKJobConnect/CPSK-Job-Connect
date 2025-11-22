import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({ success: true, message: "Consent accepted" }, { status: 200 });

    // Determine whether the request was made over HTTPS. First check
    // `x-forwarded-proto` (common behind proxies/load-balancers), then
    // fall back to the request URL protocol. Also always enable secure in
    // production.
    const forwardedProto = req.headers.get?.("x-forwarded-proto") || req.headers.get?.("x-forwarded-protocol");
    const isHttps = forwardedProto
      ? String(forwardedProto).split(',')[0].trim() === 'https'
      : (() => {
          try {
            return new URL(req.url).protocol === 'https:';
          } catch (e) {
            return false;
          }
        })();

    res.cookies.set("pdpa_consent", "true", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production" || isHttps,
    });

    return res;
  } catch (err) {
    console.error("Failed to set consent cookie:", err);
    return NextResponse.json({ error: "Failed to set consent" }, { status: 500 });
  }
}
