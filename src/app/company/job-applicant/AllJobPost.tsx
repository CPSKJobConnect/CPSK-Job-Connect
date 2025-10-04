"use client";
import React, { useState, useEffect } from "react";
import JobCard from "@/components/JobCard";
import { mockDepartmentData } from "public/data/mockDepartment";
import { JobInfo } from "@/types/job";
import { filterByCategory } from "@/lib/jobFilter";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AllJobPostProps {
  info: JobInfo[];
  onSelectCard: (id: number) => void;
}

type PostType = "All Posts" | "Active" | "Draft" | "Close";

const AllJobPost = ({ info, onSelectCard }: AllJobPostProps) => {
  const postTypes: PostType[] = ["All Posts", "Active", "Draft", "Close"];
  const [selectedType, setSelectedType] = useState<PostType>("All Posts");
  const [jobPost, setJobPost] = useState<JobInfo[]>([]);
  const [filteredJobPost, setFilteredJobPost] = useState<JobInfo[]>([]);
  const [allDepartment, setAllDepartment] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>();

  useEffect(() => {
    setJobPost(info);
    setAllDepartment(mockDepartmentData.departments);
  }, [jobPost, allDepartment]);

  useEffect(() => {
    let result = [...jobPost];

    result = result.filter((job) => {
      if (selectedType === "All Posts") return true;
      if (selectedType === "Active") return job.status === "active";
      if (selectedType === "Draft") return job.status === "draft";
      if (selectedType === "Close") return job.status === "expire";
      return true;
    });

    if (selectedDepartment) {
      result = filterByCategory(result, selectedDepartment);
    }

    setFilteredJobPost(result);
  }, [jobPost, selectedType, selectedDepartment]);

  const handleClear = () => {
    setSelectedDepartment("");
    setFilteredJobPost(jobPost);
  }
  

  return (
    <div className="flex flex-col rounded-md shadow-md w-full gap-2 p-4 overflow-y-hidden">
      <p className="text-md font-semibold text-gray-700">Job Posts ({filteredJobPost.length})</p>

      <div className="flex flex-col gap-3 flex-1">
        <div className="flex flex-row gap-2">
          {postTypes.map((type, idx) => (
            <Button
              key={idx}
              onClick={() => setSelectedType(type)}
              className={`px-4 rounded-full shadow-md transition-all duration-200 ease-in-out
              ${
                selectedType === type
                  ? "bg-[#FD873E] text-white hover:bg-[#ff985a] hover:shadow-lg hover:scale-105"
                  : "bg-white text-gray-700 border border-gray-100 hover:bg-[#FFE0CD] hover:text-[#FD873E] hover:shadow-md hover:scale-105"
              }`}
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="flex flex-row gap-2">
            <Select value={selectedDepartment} onValueChange={(val) => setSelectedDepartment(val)}>
            <SelectTrigger className="bg-white rounded-md border-gray-100 shadow-sm w-full">
                <SelectValue placeholder="All Department" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                <SelectLabel>Departments</SelectLabel>
                {allDepartment.map((d, idx) => (
                    <SelectItem key={idx} value={d}>
                    {d}
                    </SelectItem>
                ))}
                </SelectGroup>
            </SelectContent>
            </Select>

            <Button
            className={`text-sm text-gray-700 bg-gray-100/90 shadow-md rounded-md 
                transition-all duration-200 ease-in-out
                hover:bg-[#F3FEFA] hover:shadow-lg`}
            onClick={handleClear}
            >Clear</Button>
        </div>

        <div className="h-screen overflow-y-auto">
          {filteredJobPost.map((job, idx) => (
            <div key={idx} onClick={() => onSelectCard(idx)}>
              <JobCard size="sm" info={job} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllJobPost;
