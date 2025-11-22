import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies?.get ? req.cookies.get("pdpa_consent") : undefined;
    const consent = cookie?.value === "true";

    return NextResponse.json({ consent: Boolean(consent) }, { status: 200 });
  } catch (err) {
    console.error("Error reading pdpa_consent cookie:", err);
    return NextResponse.json({ consent: false }, { status: 200 });
  }
}
