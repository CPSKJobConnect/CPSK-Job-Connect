import { JobPostFormData } from "@/types/job";

export function validateForm(formData: JobPostFormData) {
    const detailErrors = validateDetail(formData);
    const descErrors = validateDescription(formData);
    return [...detailErrors, ...descErrors];
  }

export const validateDetail = (formData: JobPostFormData) => {
    const errors: string[] = [];
    const requiredFields: { key: keyof JobPostFormData; label: string }[] = [
      { key: "title", label: "Title" },
      { key: "location", label: "Location" },
      { key: "type", label: "Type" },
      { key: "arrangement", label: "Arrangement" },
      { key: "salary", label: "Salary" },
      { key: "deadline", label: "Deadline" },
    ];

    requiredFields.forEach((field) => {
      const value = (formData as any)[field.key];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`${field.label} is required`);
      }
    });

    if (!formData.salary || formData.salary.min == null || formData.salary.max == null) {
      errors.push("Salary is required");
    } else {
      const min = Number(formData.salary.min);
      const max = Number(formData.salary.max);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        errors.push("Salary values must be numbers");
      } else if (min > max) {
        errors.push("Min Salary should be less than Max Salary");
      } else if (min < 0 || max < 0) {
        errors.push("Salary values cannot be negative");
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.deadline) {
      const deadline = new Date(formData.deadline);
      deadline.setHours(0, 0, 0, 0);
      if (deadline < today) {
        errors.push("The deadline must be a future date.");
      }
    }

    if (!formData.category) {
      errors.push("Category is required");
    }

    return errors;
};

export const validateDescription = (formData: JobPostFormData) => {
    const errors: string[] = [];
    const descFields: { key: keyof JobPostFormData["description"]; label: string }[] = [
      { key: "overview", label: "Overview" },
      { key: "responsibility", label: "Responsibility" },
      { key: "requirement", label: "Requirement" },
      { key: "qualification", label: "Qualification" },
    ];

    descFields.forEach((field) => {
      if (!formData.description || !formData.description[field.key]) {
        errors.push(`${field.label} is required`);
      }
    });

    if (!formData.skills || formData.skills.length === 0) {
      errors.push("At least one skill is required");
    }

    return errors;
};