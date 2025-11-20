import { NextRequest, NextResponse } from 'next/server';
import { withResponseCsrfGuard } from '@/lib/csrfGuard';

async function POST_impl(request: NextRequest) {
  // Simple test endpoint which just echoes a small JSON body or returns ok
  try {
    // Try to read JSON if present
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      // ignore
    }
    return NextResponse.json({ ok: true, body }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export const POST = withResponseCsrfGuard(POST_impl as any);
export { POST_impl };
