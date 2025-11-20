import { NextRequest, NextResponse } from 'next/server';
import { withResponseCsrfGuard } from '@/lib/csrfGuard';

async function POST_impl(request: NextRequest) {
  try {
    let body = null;
    try {
      body = await request.json();
    } catch (e) {}
    return NextResponse.json({ ok: true, body }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

async function PATCH_impl(request: NextRequest) {
  try {
    let body = null;
    try {
      body = await request.json();
    } catch (e) {}
    return NextResponse.json({ ok: true, method: 'PATCH', body }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

async function DELETE_impl(request: NextRequest) {
  try {
    // For DELETE we may not have a body; just confirm we reached handler
    return NextResponse.json({ ok: true, method: 'DELETE' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export const POST = withResponseCsrfGuard(POST_impl as any);
export const PATCH = withResponseCsrfGuard(PATCH_impl as any);
export const DELETE = withResponseCsrfGuard(DELETE_impl as any);

// Note: do not export raw `_impl` handlers from Next.js route modules.
// Exporting extra named symbols breaks Next.js route typing requirements
// in production builds. Tests should import implementations from
// separate test helpers if they need the raw functions.
