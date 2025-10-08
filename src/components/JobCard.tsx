"use client";
import React from "react";
import Image from "next/image";
import { JobInfo } from "@/types/job";
import { formatPostedDate } from "@/lib/dateHelper";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer } from "react-icons/md";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { FaRegStar } from "react-icons/fa";
import { MdOutlineShare } from "react-icons/md";
import { MdOutlineLink } from "react-icons/md";
import { MdOutlineReportProblem } from "react-icons/md";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface JobCardProps {
  info: JobInfo;
  size?: "sm" | "md";
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  parttime: "bg-blue-200 text-gray-800",
  internship: "bg-orange-100 text-gray-800",
  contract: "bg-yellow-200 text-gray-800",
  hybrid: "bg-purple-200 text-gray-800"
};


const JobCard = (job: JobCardProps) => {
  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white p-4 flex flex-col gap-2 hover:bg-[#F3FEFA] transition mb-5";

    const sizeStyle = {
      sm: "w-full sm:w-[400px] min-h-[140px]",
      md: "w-full sm:w-[400px] min-h-[250px] md:w-[550px]"
    }[job.size || "md"];

  return (
    <div className={`${baseStyle} ${sizeStyle}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <Image
            src={job.info.companyLogo}
            alt="companyLogo"
            width={60}
            height={60}
            className="h-auto bg-white translate-y-1 shadow-md rounded-md"
          />
          <div className="p-2">
            <p className="font-bold text-md">{job.info.title}</p>
            <p className="text-gray-600">{job.info.companyName}</p>
          </div>
        </div>
        <div className="flex gap-3 p-2">
          <FaRegStar className="w-5 h-5" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MdOutlineShare className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem>
                  <MdOutlineLink/>
                  <p>Copy Link</p>
                </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <MdOutlineReportProblem className="text-red-600"/>
                <p className="text-red-600">Report Post</p>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex gap-4 py-2">
        <div className="flex gap-1">
          <div className="py-1"><IoLocationOutline /></div>
          <span>{job.info.location}</span>
        </div>
        <div className="flex gap-1">
          <div className="py-1"><MdOutlineTimer /></div>
          <span>{formatPostedDate(job.info.posted)}</span>
        </div>
        <div className="flex gap-1">
          <div className="py-1"><MdOutlinePeopleAlt /></div>
          <span>{job.info.applied} applied</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
      <span
        className={`px-2 py-1 rounded-md text-sm shadow-md ${
          typeColors[job.info.type] || "bg-white text-gray-800"
        }`}
      >
        {job.info.type}
      </span>
        {job.info.skills.map((tag, idx) => (
          <span key={idx} className="bg-white text-grey-800 shadow-md px-2 py-1 rounded-md text-sm">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto mb-2 flex justify-end">
        {job.size === "md" && (
          <Button className="lg:w-40 md:w-30 sm:w-30 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
            View Detail
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
