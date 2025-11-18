import { isValidImageUrl } from "@/lib/validateImageUrl";

describe("isValidImageUrl", () => {
  it("accepts non-empty http urls", () => {
    expect(isValidImageUrl("http://example.com/img.png")).toBe(true);
    expect(isValidImageUrl("https://cdn.app/logo.svg")).toBe(true);
  });

  it("rejects invalid inputs", () => {
    expect(isValidImageUrl("")).toBe(false);
    expect(isValidImageUrl(" ftp://example.com")).toBe(false);
    expect(isValidImageUrl(null)).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
  });
});
