"use client";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button"
import JobPostDetailSection from "@/app/company/job-posting/JobPostDetailSection";
import JobPostDescriptionSection from "@/app/company/job-posting/JobPostDescriptionSection";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { JobInfo, JobPostFormData } from "@/types/job";
import { defaultJobPostForm } from "@/types/job";
import { toast } from "@/lib/toastTemplate";
import { validateForm, validateDetail, validateDescription } from "@/lib/validateJobForm";
import { useRouter } from "next/navigation";

interface CompanyProps {
  name: string;
  logoUrl: string;
  backgroundUrl: string;
}


export default function Page() {
  const [formData, setFormData] = useState<JobPostFormData>(defaultJobPostForm);
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [arrangements, setArrangements] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProps | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
        const res = await fetch("/api/jobs/filter");
        const data = await res.json();
        setCategories(data.categories || []);
        setLocations(data.locations || []);
        setTypes(data.types || []);
        setArrangements(data.arrangements || []);
        setTags(data.tags || []);
    };
    fetchFilters();

    const fetchCompany = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      console.log("Session data:", data);
      setCompany(data.user || null)
    };
    fetchCompany();
  }, []);

  const previewJob = useMemo<JobInfo>(() => ({
    title: formData.title,
    companyName: company?.name || "Your Company",
    companyLogo: company?.logoUrl || "/assets/images/companyLogo.png",
    companyBg: company?.backgroundUrl || "/assets/images/companyBg.jpg",
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
  }), [formData, company]);
  
  const handlePost = async () => {
    try {
      const res = await fetch("/api/company/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          is_published: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Job posted successfully!", "Your job has been published.");
        router.push("/company/job-applicant");
      } else {
        const err = await res.json();
        toast.error("Failed to post job", err.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Something went wrong while posting the job.", "Please try again later.");
    }
  };

  const handleDraft = async () => {
    try {
      const res = await fetch("/api/company/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          is_published: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Job drafted successfully!", "Your job has been saved as a draft.");
      } else {
        const err = await res.json();
        toast.error("Failed to draft job", err.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Something went wrong while drafting the job.", "Please try again later.");
    }
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
            <JobPostDetailSection
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              types={types}
              arrangements={arrangements}
            />
          )}

          {step === 2 && (
            <JobPostDescriptionSection formData={formData} setFormData={setFormData} tags={tags} />
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
                <Button 
                data-testid="next-step-button"
                onClick={() => {
                  if (step === 1) {
                    const errors = validateDetail(formData);
                    if (errors.length > 0) {
                      errors.forEach((err) => toast.error(err));
                      return;
                    }
                  }

                  if (step === 2) {
                    const errors = validateDescription(formData);
                    if (errors.length > 0) {
                      errors.forEach((err) => toast.error(err));
                      return;
                    }
                  }

                  setStep((s) => Math.min(3, s + 1));
                }} className="bg-[#34BFA3] hover:bg-[#2DA68C]">Next</Button>
              ) : (
                <>
                  <Button
                    data-testid="publish-job-button"
                    className="bg-[#34BFA3] hover:bg-[#2DA68C] font-semibold"
                    onClick={() => {
                      const errors = validateForm(formData);
                      if (errors.length > 0) {
                        errors.forEach(err => toast.error(err));
                      } else {
                        handlePost();
                      }
                    }}
                  >
                    Publish Job
                  </Button>

                  <Button
                    data-testid="draft-job-button"
                    className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                    onClick={() => {
                      const errors = validateForm(formData);
                      if (errors.length > 0) {
                        errors.forEach(err => toast.error(err));
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
