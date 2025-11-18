/**
 * Unit tests for job filtering utilities
 */

import {
  filterByKeyword,
  filterByCategory,
  filterByLocation,
  filterByType,
  filterByArrangement,
  filterByMinSalary,
  filterByMaxSalary,
  filterByDatePost,
  filterJobs,
  sortbyDate,
} from "@/lib/jobFilter";
import { JobInfo, BookmarkJobInfo } from "@/types/job";
import { getDiffDays } from "@/lib/dateHelper";

jest.mock("@/lib/dateHelper", () => ({
  getDiffDays: jest.fn(),
}));

const jobs: JobInfo[] = [
  {
    id: "1",
    title: "Software Engineer",
    companyName: "Tech Corp",
    companyLogo: "logo.png",
    companyBg: "bg.png",
    category: "Engineering",
    location: "Bangkok",
    posted: "2025-03-01",
    applied: 12,
    salary: { min: 40000, max: 60000 },
    skills: ["React", "Node.js"],
    description: {
      overview: "Build stuff",
      responsibility: "Code",
      requirement: "Experience",
      qualification: "Degree",
    },
    type: "Full-time",
    arrangement: "Hybrid",
    deadline: "2025-04-01",
    status: "Open",
    documents: [],
  },
  {
    id: "2",
    title: "Data Analyst",
    companyName: "Data Inc",
    companyLogo: "logo2.png",
    companyBg: "bg2.png",
    category: "Analytics",
    location: "Chiang Mai",
    posted: "2025-02-20",
    applied: 5,
    salary: { min: 30000, max: 45000 },
    skills: ["SQL", "Tableau"],
    description: {
      overview: "Analyze data",
      responsibility: "Dashboards",
      requirement: "Attention to detail",
      qualification: "Degree",
    },
    type: "Contract",
    arrangement: "Remote",
    deadline: "2025-03-20",
    status: "Open",
    documents: [],
  },
  {
    id: "3",
    title: "Product Designer",
    companyName: "Design Studio",
    companyLogo: "logo3.png",
    companyBg: "bg3.png",
    category: "Design",
    location: "Bangkok",
    posted: "2025-01-15",
    applied: 20,
    salary: { min: 28000, max: 38000 },
    skills: ["Figma"],
    description: {
      overview: "Design products",
      responsibility: "Wireframes",
      requirement: "Portfolio",
      qualification: "Degree",
    },
    type: "Part-time",
    arrangement: "Onsite",
    deadline: "2025-02-15",
    status: "Open",
    documents: [],
  },
];

describe("job filter helpers", () => {
  beforeEach(() => {
    (getDiffDays as jest.Mock).mockImplementation((posted: string) => {
      switch (posted) {
        case "2025-03-01":
          return 0;
        case "2025-02-20":
          return 5;
        case "2025-01-15":
          return 20;
        default:
          return 10;
      }
    });
  });

  it("filters by keyword case-insensitively", () => {
    const results = filterByKeyword(jobs, "software");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("filters by category and location", () => {
    const byCategory = filterByCategory(jobs, "Analytics");
    expect(byCategory.map((job) => job.id)).toEqual(["2"]);

    const byLocation = filterByLocation(jobs, "Bangkok");
    expect(byLocation.map((job) => job.id)).toEqual(["1", "3"]);
  });

  it("filters by type and arrangement", () => {
    const byType = filterByType(jobs, "Contract");
    expect(byType).toHaveLength(1);
    expect(byType[0].id).toBe("2");

    const byArrangement = filterByArrangement(jobs, "Hybrid");
    expect(byArrangement.map((job) => job.id)).toEqual(["1"]);
  });

  it("filters by salary bounds", () => {
    const minFiltered = filterByMinSalary(jobs, 35000);
    expect(minFiltered.map((job) => job.id)).toEqual(["1"]);

    const maxFiltered = filterByMaxSalary(jobs, 40000);
    expect(maxFiltered.map((job) => job.id)).toEqual(["3"]);
  });

  it("filters by posted date buckets", () => {
    const today = filterByDatePost(jobs, "today");
    expect(today.map((job) => job.id)).toEqual(["1"]);

    const threeDays = filterByDatePost(jobs, "3days");
    expect(threeDays.map((job) => job.id)).toEqual(["1"]);

    const week = filterByDatePost(jobs, "week");
    expect(week.map((job) => job.id)).toEqual(["1", "2"]);

    const twoWeeks = filterByDatePost(jobs, "2weeks");
    expect(twoWeeks.map((job) => job.id)).toEqual(["1", "2"]);
  });

  it("applies combined filters via filterJobs", () => {
    const result = filterJobs(jobs, {
      keyword: "Data",
      jobCategory: "Analytics",
      location: "Chiang Mai",
      jobType: "Contract",
      jobArrangement: "Remote",
      minSalary: 25000,
      maxSalary: 50000,
      datePost: "week",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });
});

describe("sortbyDate", () => {
  const bookmarks: BookmarkJobInfo[] = [
    {
      job: jobs[0],
      added_at: "2025-03-05",
      isBookmarked: true,
      isApplied: false,
    },
    {
      job: { ...jobs[1], posted: "invalid-date" },
      added_at: "2025-02-25",
      isBookmarked: true,
      isApplied: false,
    },
    {
      job: jobs[2],
      added_at: "2025-01-20",
      isBookmarked: true,
      isApplied: false,
    },
  ];

  it("returns empty array when input invalid", () => {
    expect(sortbyDate(undefined)).toEqual([]);
  });

  it("sorts descending by default and handles invalid dates", () => {
    const sorted = sortbyDate(bookmarks);
    expect(sorted.map((item) => item.job.id)).toEqual(["1", "3", "2"]);
  });

  it("sorts ascending when specified", () => {
    const sortedAsc = sortbyDate(bookmarks, "asc");
    expect(sortedAsc.map((item) => item.job.id)).toEqual(["3", "1", "2"]);
  });
});
