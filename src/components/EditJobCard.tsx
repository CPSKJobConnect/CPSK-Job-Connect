"use client";

import { FiEdit } from "react-icons/fi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { JobPostFormData, JobInfo } from "@/types/job";
import { useEffect, useState, useMemo } from "react";
import JobDescriptionCard from "./JobDescriptionCard";
import SkillCombobox from "./SkillCombobox";
import LocationCombobox from "./LocationCombobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditJobCardProps {
  job: JobInfo;
  formData: JobPostFormData;
  setFormData: (data: JobPostFormData) => void;
  handleEdit?: () => Promise<boolean> | boolean;
  categories: string[];
  jobTypes: string[];
  arrangements: string[];
  tags: string[];
}

interface CompanyProps {
  name: string;
  profile_url: string;
  bg_profile_url: string;
}

export default function EditJobCard({ job,formData, setFormData, handleEdit, 
  categories, jobTypes, arrangements,tags}: EditJobCardProps) {
  const [open, setOpen] = useState(false);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [jobTypeList, setJobTypeList] = useState<string[]>([]);
  const [jobArrangementList, setJobArrangementList] = useState<string[]>([]);
  const [preview, setPreview] = useState<boolean>(false);
  const [company, setCompany] = useState<CompanyProps | null>(null);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);

  useEffect(() => {
    setCategoryList(categories);
    setJobTypeList(jobTypes);
    setJobArrangementList(arrangements);
    setSkillOptions(tags)

    const fetchCompany = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      console.log("Session data:", data);
      setCompany(data.user || null)
    };
    fetchCompany();
  }, [categories, jobTypes, arrangements]);

  useEffect(() => {
    console.log("edit form data: ", formData);
  }, [formData, setFormData]);

  const handleCancel = () => {
    setFormData({
      title: job.title,
      category: job.category,
      location: job.location,
      type: job.type,
      arrangement: job.arrangement,
      salary: { min: job.salary.min, max: job.salary.max },
      posted: job.posted,
      deadline: job.deadline,
      skills: job.skills,
      description: { ...job.description },
    });
    setOpen(false);
  }

  const onSave = async () => {
    let result = true;
    try {
      result = handleEdit ? await Promise.resolve(handleEdit()) : true;
    } catch (err) {
      console.error("Error in handleEdit:", err);
      result = false;
    }
    if (result) {
      setOpen(false);
      setPreview(false);
    }
  }

  const previewJob = useMemo<JobInfo>(() => ({
      title: formData.title,
      companyName: company?.name || "Your Company",
      companyLogo: company?.profile_url || "/assets/images/companyLogo.png",
      companyBg: company?.bg_profile_url || "/assets/images/companyBg.jpg",
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

    const initialDeadline = useMemo(() => {
      if (!job?.deadline) return "";
      try {
        const d = new Date(job.deadline);
        if (Number.isNaN(d.getTime())) return "";
        return d.toISOString().slice(0, 10);
      } catch (e) {
        return "";
      }
    }, [job?.deadline]);

    const displayedDeadline = useMemo(() => {
      const fd = formData?.deadline;
      if (!fd) return initialDeadline;
      try {
        const d = new Date(fd);
        if (Number.isNaN(d.getTime())) return initialDeadline;
        return d.toISOString().slice(0, 10);
      } catch (e) {
        return initialDeadline;
      }
    }, [formData?.deadline, initialDeadline]);

  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button className="lg:w-20 h-8 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition" 
            onClick={() => setOpen(true)}
            data-testid="edit-job-button">
                <div className="flex gap-2 items-center">
                    <FiEdit />
                    <p>Edit</p>
                </div>
            </Button>
      </DialogTrigger>
      {open && (
      <DialogContent className="md:min-w-[700px] sm:min-w-[400px] max-h-[80vh] overflow-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Post - {job.title}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-6">
          {preview ? (
            <>
              <p className="font-semibold">Preview</p>
              <div className="mt-4">
                <JobDescriptionCard size="md" job={previewJob} onApply={false} onEdit={false} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Location</label>
                <LocationCombobox
                    data-testid="edit-job-location-combobox"
                    value={formData.location}
                    onChange={(loc) => setFormData({ ...formData, location: loc })}
                    className="w-[300px]"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Arrangement</label>
                <Select
                  value={formData.arrangement} 
                  onValueChange={(value) => setFormData({ ...formData, arrangement: value })}
                >
                  <SelectTrigger data-testid="edit-job-arrangement" className="w-full">
                    <SelectValue placeholder="Select arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobArrangementList.map((arr) => (
                      <SelectItem key={arr} value={arr}>
                        {arr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Job Type</label>
                <Select
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="edit-job-type" className="w-full">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypeList.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Deadline</label>
                <Input
                  data-testid="edit-job-deadline"
                  className="w-full"
                  type="date"
                  value={displayedDeadline}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      deadline: value,
                    });
                  }}
                  placeholder={initialDeadline}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Salary (min)</label>
                <Input
                  data-testid="edit-job-salary-min"
                  className="w-full"
                  value={formData.salary.min?.toString() ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = Number(value);

                    setFormData({
                      ...formData,
                      salary: {
                        ...formData.salary,
                        min: isNaN(numericValue) ? 0 : numericValue,
                      },
                    });
                  }}
                  placeholder={String(job.salary.min)}
                />
              </div>

              <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">Salary (max)</label>
                  <Input
                      data-testid="edit-job-salary-max"
                      className="w-full"
                      value={formData.salary.max?.toString() ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = Number(value);

                        setFormData({
                          ...formData,
                          salary: {
                            ...formData.salary,
                            max: isNaN(numericValue) ? 0 : numericValue,
                          },
                        });
                      }}
                      placeholder={String(job.salary.max)}
                  />
              </div>

              <div className="flex flex-col md:col-span-2">
                  <label className="text-sm text-gray-700 mb-1">Skills</label>
                  <SkillCombobox
                      data-testid="edit-job-skills-combobox"
                      selectedSkill={formData.skills}
                      setSelectedSkill={(skills) => setFormData({ ...formData, skills })}
                      existingSkills={skillOptions}
                  />
              </div>

              <div className="flex flex-col md:col-span-2">
                  <label className="text-sm text-gray-700 mb-1">Category</label>
                  <Select
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                      <SelectTrigger data-testid="edit-job-category" className="w-full">
                      <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                      {categoryList.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                          {cat}
                          </SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
              </div>
              
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-700 mb-1">Overview</label>
                  <Input
                  data-testid="edit-job-overview"
                  value={formData.description.overview}
                  onChange={(e) => setFormData({ ...formData, 
                      description: {
                          ...formData.description,
                          overview: e.target.value
                      }
                  })}
                  placeholder={job.description.overview}
                  />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-700 mb-1">Responsibility</label>
                  <Input
                  data-testid="edit-job-responsibility"
                  value={formData.description.responsibility}
                  onChange={(e) => setFormData({ ...formData, 
                      description: {
                          ...formData.description,
                          responsibility: e.target.value
                      }
                  })}
                  placeholder={job.description.responsibility}
                  />
              </div>
              
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-700 mb-1">Requirement</label>
                  <Input
                  data-testid="edit-job-requirement"
                  value={formData.description.requirement}
                  onChange={(e) => setFormData({ ...formData, 
                      description: {
                          ...formData.description,
                          requirement: e.target.value
                      }
                  })}
                  placeholder={job.description.requirement}
                  />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-700 mb-1">Qualification</label>
                  <Input
                  data-testid="edit-job-qualification"
                  value={formData.description.qualification}
                  onChange={(e) => setFormData({ ...formData, 
                      description: {
                          ...formData.description,
                          qualification: e.target.value
                      }
                  })}
                  placeholder={job.description.qualification}
                  />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-6 flex justify-end gap-3">
          <Button onClick={handleCancel} variant="ghost" className="h-10">
            Cancel
          </Button>
          {preview ? (
            <>
              <Button onClick={() => setPreview(false)} variant="ghost" className="h-10">
                Back to Edit
              </Button>
              <Button data-testid="save-edit-job-btn-1" onClick={onSave} className="h-10 bg-[#2BA17C] hover:bg-[#27946F]">
                Save
              </Button>
            </>
          ) : (
            <>
              <Button data-testid="preview-edit-job-btn" onClick={() => setPreview(true)} className="h-10 bg-gray-200 text-gray-700 hover:bg-gray-300">
                Preview
              </Button>
              <Button data-testid="save-edit-job-btn-2" onClick={onSave} className="h-10 bg-[#2BA17C] hover:bg-[#27946F]">
                Save
              </Button>
            </>
          )}
        </div>
      </DialogContent>
      )}
    </Dialog>
  );
}