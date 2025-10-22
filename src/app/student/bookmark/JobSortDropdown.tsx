"use client";
import { useState } from "react";
import { BookmarkJobInfo } from "@/types/job";
import { sortbyDate } from "@/lib/jobFilter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu"
import { BiSortAlt2 } from "react-icons/bi";
import { Button } from "@/components/ui/button";
import { FiChevronDown } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";


interface JobSortDropdownProps {
  job: BookmarkJobInfo[];
  setSortedBookmarkedJobs: React.Dispatch<React.SetStateAction<BookmarkJobInfo[]>>;
}


const JobSortDropdown = ({job, setSortedBookmarkedJobs}: JobSortDropdownProps) => {
  const [sortOption, setSortOption] = useState<string>("");

  const handleJobSort = (value: string) => {
    setSortOption(value);
    if (value === "recent") {
      setSortedBookmarkedJobs(sortbyDate(job, "desc"));
    } else if (value === "earliest") {
      setSortedBookmarkedJobs(sortbyDate(job, "asc"));
    } else if (value === "notApplied") {
      setSortedBookmarkedJobs(job.filter((j) => !j.isApplied));
    }
  }
  
  return (
    <div className="md:w-[150px] w-full flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="group bg-white border border-gray-200 md:w-[150px] text-gray-800 font-semibold rounded-full px-4 flex items-center justify-between gap-2 transition-colors hover:bg-[#34BFA3] hover:text-white focus:outline-none focus:ring-0">
                <span className="flex items-center gap-2">
                  <BiSortAlt2 size={18} className="text-gray-600 group-hover:text-white" />
                  <span className="hidden sm:inline">Sort</span>
                </span>
                <FiChevronDown className="w-4 h-4 text-gray-600 group-hover:text-white" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 p-2">
              <div className="px-2 py-1 text-xs text-gray-500">Sort by</div>
              <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => handleJobSort(value)}>
                <DropdownMenuRadioItem
                  value="recent"
                  className={`flex items-center justify-between pl-8 pr-3 py-2 rounded-md text-sm ${
                    sortOption === "recent" ? "bg-green-50 text-green-700" : "hover:bg-gray-100"
                  }`}
                >
                  <span>Recently added</span>
                  {sortOption === "recent" && <IoMdCheckmark className="w-4 h-4 text-green-600" />}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value="earliest"
                  className={`flex items-center justify-between pl-8 pr-3 py-2 rounded-md text-sm ${
                    sortOption === "earliest" ? "bg-green-50 text-green-700" : "hover:bg-gray-100"
                  }`}
                >
                  <span>Earliest added</span>
                  {sortOption === "earliest" && <IoMdCheckmark className="w-4 h-4 text-green-600" />}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value="notApplied"
                  className={`flex items-center justify-between pl-8 pr-3 py-2 rounded-md text-sm ${
                    sortOption === "notApplied" ? "bg-green-50 text-green-700" : "hover:bg-gray-100"
                  }`}
                >
                  <span>Not applied yet</span>
                  {sortOption === "notApplied" && <IoMdCheckmark className="w-4 h-4 text-green-600" />}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  );
};

export default JobSortDropdown;
