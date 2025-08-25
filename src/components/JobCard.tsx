"use client";
import React from "react";

interface JobCardProps {
  companyLogo: string;
  jobName: string;
  companyName: string;
  location: string;
  posted: string;
  applied: number;
  tags: string[];
  size?: "sm" | "md";
}

const JobCard: React.FC<JobCardProps> = ({companyLogo, jobName, companyName, location, 
  posted, applied, tags, size = "md"}) => {
    
  const baseStyle =
    "rounded-xl shadow-md border border-gray-200 bg-white p-4 flex flex-col gap-2 hover:bg-[#F3FEFA] transition";

  const sizeStyle = {
    sm: "w-[400px] h-[140px] text-sm",
    md: "w-[580px] h-[280px] text-md"
  }[size];

  return (
    <div className={`${baseStyle} ${sizeStyle}`}>
    </div>
  );
};

export default JobCard;
