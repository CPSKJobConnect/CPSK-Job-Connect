"use client";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { JobFilterInfo } from "@/types/filter";
import { useEffect, useState } from "react";
import { BiCategory } from "react-icons/bi";
import { IoIosArrowDown, IoMdSearch } from "react-icons/io";
import { IoLocationOutline } from "react-icons/io5";
import { LuFilter, LuTags } from "react-icons/lu";
import { MdOutlineDateRange } from "react-icons/md";
import { TbCurrencyBaht } from "react-icons/tb";

export interface JobFilters {
    keyword: string;
    jobCategory: string;
    location: string;
    jobType: string;
    jobArrangement: string;
    minSalary: string;
    maxSalary: string;
    datePost: string;
}

interface JobFilterBarProps {
    filter: JobFilterInfo | null;
    onSearch?: (filters: JobFilters) => void;
}

const JobFilterBar = ({ filter, onSearch }: JobFilterBarProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const defaultFilters: JobFilters = {
    keyword: "",
    jobCategory: "",
    location: "",
    jobType: "",
    jobArrangement: "",
    minSalary: "",
    maxSalary: "",
    datePost: "",
  };
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);

  useEffect(() => {
    console.log(filters);
  }, [filters]);

  const updateFilter = (field: string, value: string) => {
    setFilters((prev) => ({...prev, [field]: value}))
  };

  const handleClearAll = () => {
    setFilters(defaultFilters);
    if (onSearch) onSearch(defaultFilters);
  };

  return (
    <div 
  className="w-full h-auto rounded-2xl p-4 shadow-md border border-gray-100 bg-white">
        <div className="flex flex-col justify-center items-center mb-4">
            <p className="font-semibold text-2xl text-gray-800">
                Find Your Dream Job
            </p>
            <p className="text-gray-600 text-sm mt-1 text-center">
                Discover opportunities that match your skills and aspirations
            </p>
        </div>
        <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center">
            <div className="relative flex-[2]">
                <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search by job title, company or skills..."
                    value={filters.keyword}
                    onChange={(e) => updateFilter("keyword", e.target.value)}
                    className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm"
                />
            </div>


            <div className="relative flex-1">
                <BiCategory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <Select value={filters.jobCategory} 
                onValueChange={(val) => updateFilter("jobCategory", val)}>
                    <SelectTrigger className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full cursor-pointer">
                        <SelectValue placeholder="Job Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Job Category</SelectLabel>
                        {filter?.categories?.map((category, idx) => (
                            <SelectItem key={idx} value={category}>{category}</SelectItem>
                        ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                <LuFilter className="w-4 h-4 text-[#006C67]" />
                <p className="text-[#006C67] text-sm font-bold">Filters</p>
                <IoIosArrowDown className="w-4 h-4 text-[#006C67]" />
            </button>
        </div>

    {isOpen && (
        <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center p-2">
            <div className="relative flex-1">
                <IoLocationOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <Select value={filters.location} 
                onValueChange={(val) => updateFilter("location", val)}>
                    <SelectTrigger className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
                        <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Locations</SelectLabel>
                            {filter?.locations?.map((location, idx) => (
                                <SelectItem key={idx} value={location}>{location}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative flex-1">
                <TbCurrencyBaht className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Select value={filters.minSalary} 
                onValueChange={(val) => updateFilter("minSalary", val)}>
                    <SelectTrigger className="pl-8 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
                        <SelectValue placeholder="Min Salary" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Min Salary</SelectLabel>
                            {filter?.salaryRanges?.map((salary, idx) => (
                                <SelectItem key={idx} value={salary}>{salary}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative flex-1">
                <TbCurrencyBaht className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Select value={filters.maxSalary} 
                onValueChange={(val) => updateFilter("maxSalary", val)}>
                    <SelectTrigger className="pl-8 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
                        <SelectValue placeholder="Max Salary" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Max Salary</SelectLabel>
                            {filter?.salaryRanges?.map((salary, idx) => (
                                <SelectItem key={idx} value={salary}>{salary}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative flex-1">
                <LuTags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Select value={filters.jobType} 
                onValueChange={(val) => updateFilter("jobType", val)}>
                    <SelectTrigger className="pl-9 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
                        <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Types</SelectLabel>
                            {filter?.types?.map((type, idx) => (
                                <SelectItem key={idx} value={type}>{type}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative flex-1">
                <LuTags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Select value={filters.jobArrangement} 
                onValueChange={(val) => updateFilter("jobArrangement", val)}>
                    <SelectTrigger className="pl-9 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
                        <SelectValue placeholder="Job Arrangement" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Arrangements</SelectLabel>
                            {filter?.arrangements?.map((arrangement, idx) => (
                                <SelectItem key={idx} value={arrangement}>{arrangement}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative flex-1">
                <MdOutlineDateRange className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Select value={filters.datePost} 
                onValueChange={(val) => updateFilter("datePost", val)}>
                    <SelectTrigger className="pl-9 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
                        <SelectValue placeholder="Date Posted" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Date Posted</SelectLabel>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="3days">Last 3 Days</SelectItem>
                        <SelectItem value="5days">Last 5 Days</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="2weeks">Last 2 Weeks</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
        ) 
    }
    <div className="flex flex-row w-full gap-5 px-28 mt-5">
        <button
            onClick={() => {if (onSearch) onSearch(filters);}}
            className="w-full p-2 rounded-xl flex items-center justify-center gap-1 bg-gradient-to-r from-[#FFB689] to-[#FFA66E] hover:brightness-110 transition cursor-pointer"
            >
            <IoMdSearch className="w-4 h-4 text-white" />
            <p className="text-white text-sm font-bold">Search Jobs</p>
        </button>

        <button
            onClick={handleClearAll}
            className="w-full p-2 rounded-xl flex items-center justify-center gap-1 border border-[#FD873E] hover:bg-[#FFCFB2]/40 transition cursor-pointer"
            >
            <p className="text-[#FD873E] text-sm font-bold">Clear All</p>
        </button>
    </div>
    </div>
  );
};

export default JobFilterBar;
