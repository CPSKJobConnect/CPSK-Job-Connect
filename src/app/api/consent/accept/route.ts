import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ success: true, message: "Consent accepted" }, { status: 200 });

    res.cookies.set("pdpa_consent", "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("Failed to set consent cookie:", err);
    return NextResponse.json({ error: "Failed to set consent" }, { status: 500 });
  }
}
