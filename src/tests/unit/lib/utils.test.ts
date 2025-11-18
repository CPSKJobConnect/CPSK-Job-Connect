import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names with deduped tailwind styles", () => {
    const result = cn("px-2", "text-gray-500", ["px-4", { hidden: false }], {
      "text-gray-700": true,
      "font-bold": true,
    });

    expect(result).toBe("px-4 text-gray-700 font-bold");
  });

  it("handles falsy values gracefully", () => {
    const result = cn(undefined, null, "", false, "block");
    expect(result).toBe("block");
  });
});
