/**
 * Unit tests for date helper utilities
 */

import { formatPostedDate, getDiffDays } from "@/lib/dateHelper";

describe("dateHelper", () => {
  const fixedDate = new Date("2025-01-08T12:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("formatPostedDate", () => {
    it("returns Today when date matches current day", () => {
      expect(formatPostedDate("2025-01-08T00:00:00.000Z")).toBe("Today");
    });

    it("returns number of days for values under a week", () => {
      expect(formatPostedDate("2025-01-05T00:00:00.000Z")).toBe("3 days ago");
    });

    it("returns number of weeks for older posts", () => {
      expect(formatPostedDate("2024-12-15T00:00:00.000Z")).toBe("3 weeks ago");
    });
  });

  describe("getDiffDays", () => {
    it("calculates integer day differences", () => {
      expect(getDiffDays("2025-01-07T23:59:59.000Z")).toBe(0);
      expect(getDiffDays("2024-12-31T00:00:00.000Z")).toBe(8);
    });
  });
});
