"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import JobPostDetailSection from "@/app/company/job-posting/JobPostDetailSection";
import JobPostDescriptionSection from "@/app/company/job-posting/JobPostDescriptionSection";
import { JobPostFormData } from "@/types/job";
import { defaultJobPostForm } from "@/types/job";
import { toast } from "sonner"

export default function Page() {
  const [formData, setFormData] = useState<JobPostFormData>(defaultJobPostForm);
  const [jobTypes, setJobTypes] = useState<{id:number,name:string}[]>([]);
  const [jobArrangements, setJobArrangements] = useState<{id:number,name:string}[]>([]);
  const [jobCategories, setJobCategories] = useState<{id:number,name:string}[]>([]);
  const [jobTags, setJobTags] = useState<{id:number,name:string}[]>([]);

  useEffect(() => {
    console.log("post form: ", formData);
  }, [formData]);

  useEffect(() => {
    fetch("/api/jobs/type").then(res => res.json()).then(setJobTypes);
    fetch("/api/jobs/arrangement").then(res => res.json()).then(setJobArrangements);
    fetch("/api/jobs/categorie").then(res => res.json()).then(setJobCategories);
    fetch("/api/jobs/tag").then(res => res.json()).then(setJobTags);
  }, []);

  const validateForm = (formData: JobPostFormData) => {
    const errors: string[] = [];
    const today = new Date();
    const deadline = new Date(formData.deadline);

    const requiredFields: { key: keyof JobPostFormData; label: string }[] = [
      { key: "title", label: "Title" },
      { key: "department", label: "Department" },
      { key: "location", label: "Location" },
      { key: "type", label: "Type" },
      { key: "arrangement", label: "Arrangement" },
      { key: "minSalary", label: "Min Salary" },
      { key: "maxSalary", label: "Max Salary" },
      { key: "deadline", label: "Deadline" },
    ];
    requiredFields.forEach(field => {
      if (!formData[field.key]) {
        errors.push(`${field.label} is required`);
      }
    });
  
    if (formData.minSalary && formData.maxSalary && +formData.minSalary > +formData.maxSalary) {
      errors.push("Min Salary should be less than Max Salary");
    }

    if (deadline < today) {
      errors.push("The deadline must be a future date.");
    }
  
    if (!formData.skills || formData.skills.length === 0) {
      errors.push("At least one skill is required");
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

      <Tabs defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
        </TabsList>
        <TabsContent value="detail">
          <JobPostDetailSection 
          formData={formData}
          setFormData={setFormData}
          />
        </TabsContent>

        <TabsContent value="description">
          <JobPostDescriptionSection 
          formData={formData}
          setFormData={setFormData}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-start gap-3">
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
      </div>
    </div>
  );
}
