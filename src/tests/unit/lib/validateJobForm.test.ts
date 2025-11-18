import {
  validateForm,
  validateDetail,
  validateDescription,
} from "@/lib/validateJobForm";
import { JobPostFormData } from "@/types/job";

const baseForm: JobPostFormData = {
  title: "Engineer",
  category: "Software",
  location: "Bangkok",
  type: "Full-time",
  arrangement: "Hybrid",
  salary: { min: 40000, max: 60000 },
  posted: "2025-01-01",
  deadline: "2025-12-31",
  skills: ["React"],
  description: {
    overview: "Build features",
    responsibility: "Ship code",
    requirement: "Experience",
    qualification: "Degree",
  },
  documents: [],
};

describe("validateJobForm helpers", () => {
  it("returns empty array for valid form", () => {
    expect(validateForm(baseForm)).toEqual([]);
  });

  it("detects missing required detail fields and salary issues", () => {
    const errors = validateDetail({
      ...baseForm,
      title: "",
      salary: { min: 70000, max: 50000 },
      deadline: "2000-01-01",
      category: "",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "Title is required",
        "Category is required",
        "Min Salary should be less than Max Salary",
        "The deadline must be a future date.",
      ])
    );
  });

  it("requires salary values to be numeric", () => {
    const errors = validateDetail({
      ...baseForm,
      salary: { min: 1000 as any, max: "abc" as any },
    });
    expect(errors).toEqual(
      expect.arrayContaining(["Salary values must be numbers"])
    );
  });

  it("prevents negative salary values", () => {
    const errors = validateDetail({
      ...baseForm,
      salary: { min: -1000, max: -500 },
    });
    expect(errors).toEqual(
      expect.arrayContaining(["Salary values cannot be negative"])
    );
  });

  it("requires description fields and skills", () => {
    const errors = validateDescription({
      ...baseForm,
      description: {
        overview: "",
        responsibility: "",
        requirement: "",
        qualification: "",
      },
      skills: [],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "Overview is required",
        "Responsibility is required",
        "Requirement is required",
        "Qualification is required",
        "At least one skill is required",
      ])
    );
  });
});
