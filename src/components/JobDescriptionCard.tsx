"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { LiaMoneyCheckAltSolid } from "react-icons/lia";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinFill } from "react-icons/ri";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { JobInfo } from "@/types/job";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { JobPostFormData } from "@/types/job";
import SkillCombobox from "./SkillCombobox";
import CategoryCombobox from "./CategoryCombobox";
import LocationCombobox from "./LocationCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface JobDescriptionProps {
  job: JobInfo;
  size: "sm" | "md";
  onApply: boolean;
  onEdit: boolean;
  tags?: string[];
  categoryList?: string[];
  typeList?: string[];
  arrangementList?: string[];
  onUpdate?: () => void;
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  "part-time": "bg-blue-200 text-gray-800",
  internship: "bg-orange-100 text-gray-800",
  freelance: "bg-yellow-200 text-gray-800",
};



const JobDescriptionCard = ({job, size, onApply, onEdit, tags, categoryList: propCategoryList, typeList: propTypeList, arrangementList: propArrangementList, onUpdate }: JobDescriptionProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<JobPostFormData>({
    title: job.title,
    category: job.category,
    location: job.location,
    type: job.type,
    arrangement: job.arrangement,
    salary: { min: job.salary.min, max: job.salary.max },
    posted: job.posted,
    deadline: job.deadline,
    skills: job.skills,
    description: {
      overview: job.description.overview,
      responsibility: job.description.responsibility,
      requirement: job.description.requirement,
      qualification: job.description.qualification,
    },
  });
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [jobTypeList, setJobTypeList] = useState<string[]>([]);
  const [jobArrangementList, setJobArrangementList] = useState<string[]>([]);

  useEffect(() => {
    setCategoryList(propCategoryList || []);
    setJobTypeList(propTypeList || []);
    setJobArrangementList(propArrangementList || []);
  }, [propCategoryList, propTypeList, propArrangementList])

  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white flex flex-col gap-2 transition mb-5";

  const sizeStyle = {
    sm: "w-full sm:w-[400px]",
    md: "w-full h-auto",
  }[size];

  const handleApply = () => {
    router.push(`/student/job-apply/${job.id}`);
  };

  const handleSave = async () => {

  };

  const handleEdit = async () => {
      const confirmed = window.confirm("Are you sure you want to save these changes?");
      if (!confirmed) return;

      try {
    const body = {
      location: formData.location,
      arrangement: formData.arrangement,
      type: formData.type,
      min_salary: formData.salary.min,
      max_salary: formData.salary.max,
      aboutRole: formData.description.overview,
      requirements: formData.description.requirement.split("\n"),
      qualifications: formData.description.qualification.split("\n"),
      tags: formData.skills,
      category: formData.category,
    };

    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to update job");
      return;
    }

    alert("Job updated successfully!");
    setIsEditing(false);

    // Call the onUpdate callback to refresh data in parent component
    if (onUpdate) {
      onUpdate();
    }
  } catch (error) {
    console.error("Save error:", error);
    alert("Something went wrong while saving the job.");
  }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this job post?");
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/jobs/${job.id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            alert("Job deleted successfully!");
            router.refresh();
        } else {
            const data = await res.json();
            alert(data.error || "Failed to delete job.");
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("Something went wrong while deleting the job.");
    }
  };

  return (
    <div className={`${baseStyle} ${sizeStyle}`}>
      <div className="relative w-full h-40">
        {job.companyBg ? (
          <Image
          src={job.companyBg}
          alt="company background"
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-100" /> // หรือ bg-white ถ้าอยากเป็นขาว
      )}

        {onEdit && (
          <>
            {isEditing ? (
              <>
                <div className="absolute flex right-16 top-2">
                  <Button
                    className="lg:w-20 h-8 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition"
                    onClick={handleEdit}
                  >
                    <div className="flex gap-2 items-center">
                      <p>Save</p>
                    </div>
                  </Button>
                </div>

                <Button
                  onClick={() => setIsEditing(false)}
                  className="absolute flex right-4 top-2 w-10 h-8 bg-gray-100/80 text-gray-800 shadow-lg hover:bg-gray-100 transition"
                >
                  <p>×</p>
                </Button>
              </>
            ) : (
              <>
                <div className="absolute flex right-16 top-2">
                  <Button
                    className="lg:w-20 h-8 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition"
                    onClick={() => setIsEditing(true)}
                  >
                    <div className="flex gap-2 items-center">
                      <FiEdit />
                      <p>Edit</p>
                    </div>
                  </Button>
                </div>

                <Button
                  onClick={handleDelete}
                  className="absolute flex right-4 top-2 w-10 h-8 bg-gradient-to-b from-[#FF755D] to-[#F3573C] 
                  shadow-lg hover:bg-[#F9664C] transition"
                >
                  <RiDeleteBinFill />
                </Button>
              </>
            )}
          </>
        )}

        <div className="absolute -bottom-6 left-4 w-[60px] h-[60px]">
            {job.companyLogo ? (
                <Image
                    src={job.companyLogo}
                    alt={job.companyName || "Company logo"}
                    width={60}
                    height={60}
                    className="h-auto w-auto object-cover rounded-md shadow-md"
                />
            ) : (
                <div className="w-[60px] h-[60px] bg-gray-100 shadow-md rounded-md flex items-center justify-center text-sm font-medium text-gray-700">
                    {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
                </div>
            )}
        </div>
      </div>

      <div className="mt-10 px-4">
        <p className="font-bold text-lg">{job.title}</p>
        <p className="text-gray-600">{job.companyName}</p>
      </div>

      <div className="flex gap-4 px-4 py-2 text-sm text-gray-600">
        <div className="flex gap-1 items-center">
          <IoLocationOutline />
          {isEditing ? (
            <LocationCombobox
                value={formData.location}
                onChange={(value) => setFormData({ ...formData, location: value })}
                showIcon={false}
            />
          ) : (
            <span>{job.location}</span>
          )}
        </div>
        <div className="flex gap-1 items-center">
          <HiOutlineOfficeBuilding />
          {isEditing ? (
            <Select 
            value={formData.arrangement} 
            onValueChange={(value) => setFormData({ ...formData, arrangement: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select job arrangement" />
              </SelectTrigger>
              <SelectContent>
                {jobArrangementList.map((arr) => (
                  <SelectItem key={arr} value={arr}>{arr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span>{job.arrangement}</span>
          )}
        </div>
        <div className="flex gap-1 items-center">
          <LiaMoneyCheckAltSolid />
          {isEditing ? (
            <Input
              className="w-auto max-w-[100px] text-sm h-6 px-2 py-1"
              value={formData.salary.min}
              onChange={(e) => setFormData({ ...formData, 
                  salary: {
                      ...formData.salary,
                      min: Number(e.target.value)
                  }
              })}
              placeholder={(job.salary.min).toString()}
            />
          ) : (
            <span>{job.salary.min}</span>
          )}
          <span> - </span>
          {isEditing ? (
            <Input
              className="w-auto max-w-[100px] text-sm h-6 px-2 py-1"
              value={formData.salary.max}
              onChange={(e) => setFormData({ ...formData, 
                  salary: {
                      ...formData.salary,
                      max: Number(e.target.value)
                  }
              })}
              placeholder={(job.salary.max).toString()}
            />
          ) : (
            <span>{job.salary.max} bath</span>
          )}
        </div>
        <div className="flex gap-1 items-center">
          <MdOutlinePeopleAlt />
          <span>{job.applied} applied</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 mt-2">
        {isEditing ? (
            <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="max-w-[100px] mt-8">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypeList.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span
              className={`px-2 py-1 rounded-md text-sm shadow-md ${
                typeColors[job.type] || "bg-white text-gray-800"
              }`}
            >
              {job.type}
            </span>
          )}

        {isEditing ? (
            <SkillCombobox
              selectedSkill={formData.skills}
              setSelectedSkill={(skills) => setFormData({ ...formData, skills })}
              existingSkills={tags || []}
            />
        ) : (
          job.skills.map((tag, idx) => (
            <span
              key={idx}
              className="bg-white text-grey-800 shadow-md px-2 py-1 rounded-md text-sm"
            >
              {tag}
            </span>
          ))
        )}
      </div>

      {isEditing && 
      <div className="flex flex-col gap-2 px-4 mt-5">
          <p className="text-sm text-gray-800">Job Category</p>
          <CategoryCombobox
          selectedCategory={formData.category}
          setSelectedCategory={(category) => setFormData({ ...formData, category })}
          placeholder={formData.category}
          categoryList={categoryList}
          />
      </div>
      }
      <div className="flex-1 overflow-y-auto px-4">
      <div className="flex flex-col gap-6 px-5 mt-5">
        <div>
          <p className="font-bold">About Role</p>
          {isEditing ? (
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
          ) : (
            <p>{job.description.overview}</p>
          )}
        </div>

        <div>
          <p className="font-bold">Responsibilities</p>
          {isEditing ? (
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
          ) : (
            <p>{job.description.responsibility}</p>
          )}
        </div>

        <div>
          <p className="font-bold">Requirements</p>
          {isEditing ? (
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
          ) : (
            <p>{job.description.requirement}</p>
          )}
        </div>

        <div>
          <p className="font-bold">Qualifications</p>
          {isEditing ? (
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
          ) : (
            <p>{job.description.qualification}</p>
          )}
        </div>
      </div>
      </div>

      <div className="px-4 py-4 flex justify-start gap-3 mt-auto">
        {onApply && (
          <>
            <Button onClick={handleApply}
              className="lg:w-40 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              Quick Apply
            </Button>
            <Button onClick={handleSave}
            className="h-10 bg-[#67C3A6] shadow-lg hover:bg-[#27946F] transition">
            Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDescriptionCard;
