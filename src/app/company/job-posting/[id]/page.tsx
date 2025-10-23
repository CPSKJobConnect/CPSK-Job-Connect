"use client";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button"
import JobPostDetailSection from "@/app/company/job-posting/JobPostDetailSection";
import JobPostDescriptionSection from "@/app/company/job-posting/JobPostDescriptionSection";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { JobInfo, JobPostFormData } from "@/types/job";
import { defaultJobPostForm } from "@/types/job";
import { toast } from "sonner"


export default function Page() {
  const [formData, setFormData] = useState<JobPostFormData>(defaultJobPostForm);
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    console.log("post form: ", formData);
  }, [formData]);

  const validateForm = (formData: JobPostFormData) => {
    const errors: string[] = [];
    const today = new Date();
    const deadline = new Date(formData.deadline);

    const requiredFields: { key: keyof JobPostFormData; label: string }[] = [
      { key: "title", label: "Title" },
      { key: "location", label: "Location" },
      { key: "type", label: "Type" },
      { key: "arrangement", label: "Arrangement" },
      { key: "salary", label: "Salary" },
      { key: "deadline", label: "Deadline" },
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field.key]) {
        errors.push(`${field.label} is required`);
      }
    });
  
    if (formData.salary.min && formData.salary.max && +formData.salary.min > +formData.salary.max) {
      errors.push("Min Salary should be less than Max Salary");
    }

    if (deadline < today) {
      errors.push("The deadline must be a future date.");
    }
  
    if (!formData.skills || formData.skills.length === 0) {
      errors.push("At least one skill is required");
    }
    
    if (!formData.category) {
      errors.push("Category is required");
    }

    const descFields: { key: keyof JobPostFormData["description"]; label: string }[] = [
      { key: "overview", label: "Overview" },
      { key: "responsibility", label: "Responsibility" },
      { key: "requirement", label: "Requirement" },
      { key: "qualification", label: "Qualification" },
    ];
    descFields.forEach(field => {
      if (!formData.description[field.key]) {
        errors.push(`${field.label} is required`);
      }
    });
  
    return errors;
  };

  const validateDetail = (formData: JobPostFormData) => {
    const errors: string[] = [];
    const requiredFields: { key: keyof JobPostFormData; label: string }[] = [
      { key: "title", label: "Title" },
      { key: "location", label: "Location" },
      { key: "type", label: "Type" },
      { key: "arrangement", label: "Arrangement" },
      { key: "salary", label: "Salary" },
      { key: "deadline", label: "Deadline" },
    ];

    requiredFields.forEach(field => {
      if (!formData[field.key]) {
        errors.push(`${field.label} is required`);
      }
    });

    if (formData.salary.min && formData.salary.max && +formData.salary.min > +formData.salary.max) {
      errors.push("Min Salary should be less than Max Salary");
    }

    if (formData.deadline) {
      const today = new Date();
      const deadline = new Date(formData.deadline);
      if (deadline < today) {
        errors.push("The deadline must be a future date.");
      }
      return errors;
    }

    if (!formData.category) {
      errors.push("Category is required");
    }

    return errors;
  };

  const validateDescription = (formData: JobPostFormData) => {
    const errors: string[] = [];
    const descFields: { key: keyof JobPostFormData["description"]; label: string }[] = [
      { key: "overview", label: "Overview" },
      { key: "responsibility", label: "Responsibility" },
      { key: "requirement", label: "Requirement" },
      { key: "qualification", label: "Qualification" },
    ];
    descFields.forEach(field => {
      if (!formData.description[field.key]) {
        errors.push(`${field.label} is required`);
      }
    });

    if (!formData.skills || formData.skills.length === 0) {
      errors.push("At least one skill is required");
    }

    return errors;
  };

  const previewJob = useMemo<JobInfo>(() => ({
    title: formData.title,
    companyName: "Your Company",
    companyLogo: "/assets/images/companyLogo.png",
    companyBg: "/assets/images/companyBg.jpg",
    category: formData.category,
    location: formData.location,
    arrangement: formData.arrangement,
    salary: {
      min: formData.salary.min,
      max: formData.salary.max,
    },
    applied: 0,
    type: formData.type,
    skills: formData.skills,
    description: {
      overview: formData.description.overview,
      responsibility: formData.description.responsibility,
      requirement: formData.description.requirement,
      qualification: formData.description.qualification,
    },
    id: "",
    posted: "",
    deadline: formData.deadline || "",
    status: "",
  }), [formData]);
  
  const handlePost = () => {
    // post job
  };

  const handleDraft = () => {
    // draft job
  };

  return (
    <div className="flex flex-col p-4 gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xl font-semibold">Post a New Job Opening</p>
        <p className="text-md text-gray-700">Create and submit a new job for your company</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button className={`rounded-full w-8 h-8 flex items-center justify-center ${step===1?"bg-[#34BFA3] text-white":"bg-gray-100"}`}>1</button>
          <div className="flex-1">
            <p className="font-semibold">Fill details</p>
            <p className="text-sm text-gray-500">Basic job metadata</p>
          </div>

          <button className={`rounded-full w-8 h-8 flex items-center justify-center ${step===2?"bg-[#34BFA3] text-white":"bg-gray-100"}`}>2</button>
          <div className="flex-1">
            <p className="font-semibold">Fill description</p>
            <p className="text-sm text-gray-500">About, responsibilities, requirements</p>
          </div>

          <button className={`rounded-full w-8 h-8 flex items-center justify-center ${step===3?"bg-[#34BFA3] text-white":"bg-gray-100"}`}>3</button>
          <div className="flex-1">
            <p className="font-semibold">Preview & Submit</p>
            <p className="text-sm text-gray-500">Review and publish</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-md shadow-sm">
          {step === 1 && (
            <JobPostDetailSection formData={formData} setFormData={setFormData} />
          )}

          {step === 2 && (
            <JobPostDescriptionSection formData={formData} setFormData={setFormData} />
          )}

          {step === 3 && (
            <div>
              <p className="font-semibold">Preview</p>
              <div className="mt-4">
                {previewJob ? (
                  <JobDescriptionCard size="md" job={previewJob} onApply={false} onEdit={false} />
                ) : (
                  <p className="text-sm text-gray-500">No preview available</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <div>
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</Button>
              )}
            </div>

            <div className="flex gap-3">
              {step < 3 ? (
                <Button onClick={() => {
                  if (step === 1) {
                    const errors = validateDetail(formData);
                    if (errors.length > 0) {
                      errors.forEach((err) => toast.error(err, { duration: 4000 }));
                      return;
                    }
                  }

                  if (step === 2) {
                    const errors = validateDescription(formData);
                    if (errors.length > 0) {
                      errors.forEach((err) => toast.error(err, { duration: 4000 }));
                      return;
                    }
                  }

                  setStep((s) => Math.min(3, s + 1));
                }} className="bg-[#34BFA3] hover:bg-[#2DA68C]">Next</Button>
              ) : (
                <>
                  <Button
                    className="bg-[#34BFA3] hover:bg-[#2DA68C] font-semibold"
                    onClick={() => {
                      const errors = validateForm(formData);
                      if (errors.length > 0) {
                        errors.forEach(err => toast.error(err, { duration: 5000 }));
                      } else {
                        handlePost();
                      }
                    }}
                  >
                    Publish Job
                  </Button>

                  <Button
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                    onClick={() => {
                      const errors = validateForm(formData);
                      if (errors.length > 0) {
                        errors.forEach(err => toast.error(err, { duration: 5000 }));
                      } else {
                        handleDraft();
                      }
                    }}
                  >
                    Draft
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
