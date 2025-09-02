"use client";
import React from "react";
import Image from "next/image";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer } from "react-icons/md";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { FaRegStar } from "react-icons/fa";
import { MdOutlineShare } from "react-icons/md";
import { Button } from "./ui/button";
import { JobInfo } from "@/types/job";

interface JobCardProps {
  info: JobInfo;
  size?: "sm" | "md";
}

const JobCard = (job: JobCardProps) => {
  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white p-4 flex flex-col gap-2 hover:bg-[#F3FEFA] transition mb-5";

    const sizeStyle = {
      sm: "w-full sm:w-[400px] sm:h-[140px]",
      md: "w-full sm:w-[400px] sm:h-[250px] md:w-[550px] md:h-[250px]"
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
            <p className="font-bold text-md">{job.info.jobName}</p>
            <p className="text-gray-600">{job.info.companyName}</p>
          </div>
        </div>
        <div className="flex gap-3 p-2">
          <FaRegStar className="w-5 h-5" />
          <MdOutlineShare className="w-5 h-5" />
        </div>
      </div>

      <div className="flex gap-4 py-2">
        <div className="flex gap-1">
          <div className="py-1"><IoLocationOutline /></div>
          <span>{job.info.location}</span>
        </div>
        <div className="flex gap-1">
          <div className="py-1"><MdOutlineTimer /></div>
          <span>{job.info.posted}</span>
        </div>
        <div className="flex gap-1">
          <div className="py-1"><MdOutlinePeopleAlt /></div>
          <span>{job.info.applied} applied</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {job.info.tags.map((tag, idx) => (
          <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto mb-2 flex justify-end">
      <Button className="lg:w-40 md:w-30 sm:w-30 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
        View Detail
      </Button>
      </div>
    </div>
  );
};

export default JobCard;
