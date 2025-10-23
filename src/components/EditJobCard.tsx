"use client";

import { FiEdit } from "react-icons/fi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { JobPostFormData, JobInfo } from "@/types/job";
import { useEffect, useState } from "react";
import SkillCombobox from "./SkillCombobox";
import { mockCategory, mockJobType, mockJobArrangement } from "public/data/fakeFilterInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockCompanies } from "public/data/mockCompany";

interface EditJobCardProps {
  job: JobInfo;
  formData: JobPostFormData;
  setFormData: (data: JobPostFormData) => void;
  handleEdit?: () => void;
}

export default function EditJobCard({ job, formData, setFormData, handleEdit}: EditJobCardProps) {
  const [open, setOpen] = useState(false);
  const [locationList, setLocationmentList] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [jobTypeList, setJobTypeList] = useState<string[]>([]);
  const [jobArrangementList, setJobArrangementList] = useState<string[]>([]);

  useEffect(() => {
    const initial = [...new Set(mockCompanies[0].address)];
    setLocationmentList(initial);
    setCategoryList(mockCategory);
    setJobTypeList(mockJobType);
    setJobArrangementList(mockJobArrangement);
  }, []);

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

  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button className="lg:w-20 h-8 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition" onClick={() => setOpen(true)}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">Location</label>
                  <Select
                    value={formData.location} 
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationList.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">Arrangement</label>
                  <Select
                    value={formData.arrangement} 
                    onValueChange={(value) => setFormData({ ...formData, arrangement: value })}
                  >
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
                  <label className="text-sm text-gray-700 mb-1">Salary (min)</label>
                  <Input
                    className="w-full"
                    value={formData.salary.min}
                    onChange={(e) => setFormData({ ...formData, 
                        salary: {
                            ...formData.salary,
                            min: Number(e.target.value)
                        }
                    })}
                    placeholder={String(job.salary.min)}
                  />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm text-gray-700 mb-1">Salary (max)</label>
                    <Input
                        className="w-full"
                        value={formData.salary.max}
                        onChange={(e) => setFormData({ ...formData, 
                            salary: {
                                ...formData.salary,
                                max: Number(e.target.value)
                            }
                        })}
                        placeholder={String(job.salary.max)}
                    />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm text-gray-700 mb-1">Skills</label>
                    <SkillCombobox
                        selectedSkill={formData.skills}
                        setSelectedSkill={(skills) => setFormData({ ...formData, skills })}
                    />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm text-gray-700 mb-1">Category</label>
                    <Select
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                        <SelectTrigger className="w-full">
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
            </div>

            <div className="px-4 pb-6 flex justify-end gap-3">
              <Button onClick={handleCancel} variant="ghost" className="h-10">
                Cancel
              </Button>
              <Button onClick={handleEdit} className="h-10 bg-[#2BA17C] hover:bg-[#27946F]">
                Save
              </Button>
            </div>
        </DialogContent>)}
    </Dialog>
  );
}