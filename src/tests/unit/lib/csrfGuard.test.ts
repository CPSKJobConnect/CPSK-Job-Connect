// Ensure guard is enabled for these unit tests regardless of test-runner
// environment. Some CI or local runners may set `CSRF_GUARD_DISABLED`;
// make sure it's not set here so we assert strict behavior.
delete process.env.CSRF_GUARD_DISABLED;

import { NextRequest } from "next/server";
import { validateCsrfForRequestLike, withResponseCsrfGuard } from "@/lib/csrfGuard";
import { expect } from "@jest/globals";

describe("csrfGuard", () => {
  it("allows safe methods", () => {
    const req = new NextRequest("http://localhost/api/test", { method: "GET" });
    expect(validateCsrfForRequestLike(req)).toEqual({ ok: true });
  });

  it("rejects state-changing requests without header or auth", () => {
    const req = new NextRequest("http://localhost/api/test", { method: "POST" });
    expect(validateCsrfForRequestLike(req).ok).toBe(false);
  });

  it("accepts state-changing requests with x-app-request header", () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "x-app-request": "1" },
    });
    expect(validateCsrfForRequestLike(req)).toEqual({ ok: true });
  });

  it("accepts state-changing requests with Authorization Bearer", () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { authorization: "Bearer token" },
    });
    expect(validateCsrfForRequestLike(req)).toEqual({ ok: true });
  });

  it("withResponseCsrfGuard returns 403 when header missing", async () => {
    const handler = async (req: any) =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const guarded = withResponseCsrfGuard(handler);
    const res = await guarded(new NextRequest("http://localhost/api/test", { method: "POST" }));

    expect(res.status).toBe(403);
    const body = await res.text();
    expect(body).toContain("Forbidden");
  });

  it("withResponseCsrfGuard forwards to handler when header present", async () => {
    const handler = async (req: any) => new Response("ok", { status: 200 });
    const guarded = withResponseCsrfGuard(handler);

    const res = await guarded(
      new NextRequest("http://localhost/api/test", {
        method: "POST",
        headers: { "x-app-request": "1" },
      })
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});
