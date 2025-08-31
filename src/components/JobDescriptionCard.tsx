"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer, MdOutlinePeopleAlt } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinFill } from "react-icons/ri";

interface JobInfoProps {
  companyLogo: string;
  companyBg: string;
  jobName: string;
  companyName: string;
  location: string;
  posted: string;
  applied: number;
  tags: string[];
  description: {
    aboutRole: string;
    requirements: string[];
    qualifications: string[];
  };
  type: string;
}

interface JobDescriptionProps {
  job: JobInfoProps;
  size: "sm" | "md";
  onApply: boolean;
  onEdit: boolean;
}



const JobDescriptionCard = ({job, size, onApply, onEdit}: JobDescriptionProps) => {
  const router = useRouter();
  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white flex flex-col gap-2 transition mb-5 overflow-hidden";

  const sizeStyle = {
    sm: "w-full sm:w-[400px]",
    md: "w-full h-auto",
  }[size];

  const handleApply = () => {
    router.push("/job-apply");
  };

  const handleSave = () => {
    
  };

  const handleEdit = () => {
    
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
            <Button onClick={handleEdit}
              className="absolute flex right-16 top-2 lg:w-20 h-8 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              <div className="flex gap-2">
                <FiEdit />
                <p>Edit</p>
              </div>
            </Button>
            <Button onClick={handleDelete}
              className="absolute flex right-4 top-2 w-10 h-8 bg-gradient-to-b from-[#FF755D] to-[#F3573C] 
              shadow-lg hover:bg-[#F9664C] transition">
              <RiDeleteBinFill />
            </Button>
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
        <p className="font-bold text-lg">{job.jobName}</p>
        <p className="text-gray-600">{job.companyName}</p>
      </div>

      <div className="flex gap-4 px-4 py-2 text-sm text-gray-600">
        <div className="flex gap-1 items-center">
          <IoLocationOutline />
          <span>{job.location}</span>
        </div>
        <div className="flex gap-1 items-center">
          <MdOutlineTimer />
          <span>{job.posted}</span>
        </div>
        <div className="flex gap-1 items-center">
          <MdOutlinePeopleAlt />
          <span>{job.applied} applied</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 mt-2">
        {job.tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className="font-bold">About Role</p>
          <p>{job.description.aboutRole}</p>
        </div>

        <div>
          <p className="font-bold">Requirements</p>
          {job.description.requirements.map((requirement, index) => (
            <p key={index}>- {requirement}</p>
          ))}
        </div>

        <div>
          <p className="font-bold">Qualifications</p>
          {job.description.qualifications.map((qualification, index) => (
            <p key={index}>- {qualification}</p>
          ))}
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
