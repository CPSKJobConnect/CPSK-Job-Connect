import { GET } from "@/app/api/students/route";

describe("GET /api/students", () => {
  it("returns placeholder response", async () => {
    const res = await GET();
    expect(res.status).toBe(501);
    const data = await res.json();
    expect(data.message).toMatch(/not yet implemented/);
  });
});
