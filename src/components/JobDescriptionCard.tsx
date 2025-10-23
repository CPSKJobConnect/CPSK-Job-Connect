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
import { mockCategory, mockJobType, mockJobArrangement } from "public/data/fakeFilterInfo";
import { mockCompanies } from "public/data/mockCompany";
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
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  parttime: "bg-blue-200 text-gray-800",
  internship: "bg-orange-100 text-gray-800",
  contract: "bg-yellow-200 text-gray-800",
  hybrid: "bg-purple-200 text-gray-800"
};



const JobDescriptionCard = ({job, size, onApply, onEdit, tags}: JobDescriptionProps) => {
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
  const [locationList, setLocationmentList] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [jobTypeList, setJobTypeList] = useState<string[]>([]);
  const [jobArrangementList, setJobArrangementList] = useState<string[]>([]);
    
  useEffect(() => {
    setLocationmentList(mockCompanies[0].address);
    setCategoryList(mockCategory);
    setJobTypeList(mockJobType);
    setJobArrangementList(mockJobArrangement);
  }, [])

  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white flex flex-col gap-2 transition mb-5";

  const sizeStyle = {
    sm: "w-full sm:w-[400px]",
    md: "w-full h-auto",
  }[size];

  const handleApply = () => {
    router.push(`/student/job-apply/${job.id}`);
  };

  const handleSave = () => {
    
  };

  const handleEdit = () => {
    console.log(formData);
    setIsEditing(false);
    
  };

  const handleDelete = () => {
    
  };

  return (
    <div className={`${baseStyle} ${sizeStyle}`}>
      <div className="relative w-full h-40">
        <Image
          src={job.companyBg}
          alt="company background"
          fill
          className="object-cover"
        />
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

        <div className="absolute -bottom-6 left-4 bg-white p-2 rounded-md shadow-md">
          <Image
            src={job.companyLogo}
            alt="companyLogo"
            width={60}
            height={60}
            className="h-auto w-auto"
          />
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
            <Select 
            value={formData.location} 
            onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locationList.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              existingSkills={tags}
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
