"use client";
import React from "react";
import { Input } from "./ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useState, useEffect } from "react";
import { IoMdSearch } from "react-icons/io";
import { IoLocationOutline } from "react-icons/io5";
import { BiCategory } from "react-icons/bi";
import { LuFilter } from "react-icons/lu";
import { IoIosArrowDown } from "react-icons/io";
import { TbCurrencyBaht } from "react-icons/tb";
import { LuTags } from "react-icons/lu";
import { MdOutlineDateRange } from "react-icons/md";

interface JobFilterBarProps {
    filter: {
        categories: string[];
        locations: string[];
        types: string[];
        arrangements: string[];
        salaryRanges: string[];
    }
    onSearch?: (filters: any) => void;
}

const JobFilterBar = ({ filter, onSearch }: JobFilterBarProps) => {
  const { categories, locations, types, arrangements, salaryRanges } = filter;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    keyword: "",
    jobCategory: "",
    location: "",
    jobType: "",
    jobArrangement: "",
    minSalary: "",
    maxSalary: "",
    datePost: "",
  });

  useEffect(() => {
    console.log("Filters updated:", filters);
    if (onSearch) {
      onSearch(filters);
    }
  }, [filters]);
  

  const updateFilter = (field: string, value: string) => {
    setFilters((prev) => ({...prev, [field]: value}))
  }

  return (
    <div 
    className="w-full h-auto border border-orange-20 bg-[#FFAE7B] rounded-xl p-3 shadow-md">
        <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center">
            <div className="relative flex-[2]">
                <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search by job title, company or skills..."
                    value={filters.keyword}
                    onChange={(e) => updateFilter("keyword", e.target.value)}
                    className="pl-10 pr-3 py-2 bg-white rounded-md border-none"
                />
            </div>


            <div className="relative flex-1">
                <BiCategory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <Select value={filters.jobCategory} 
                onValueChange={(val) => updateFilter("jobCategory", val)}>
                    <SelectTrigger className="pl-10 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Job Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Job Category</SelectLabel>
                        {categories.map((category, idx) => (
                            <SelectItem key={idx} value={category}>{category}</SelectItem>
                        ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative flex-1">
                <IoLocationOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <Select value={filters.location} 
                onValueChange={(val) => updateFilter("location", val)}>
                    <SelectTrigger className="pl-10 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Locations</SelectLabel>
                            {locations.map((location, idx) => (
                                <SelectItem key={idx} value={location}>{location}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-2 rounded-xl flex items-center justify-center gap-1"
                >
                <LuFilter className="w-4 h-4 text-[#006C67]" />
                <p className="text-[#006C67] text-sm font-bold">Filters</p>
                <IoIosArrowDown className="w-4 h-4 text-[#006C67]" />
            </button>
        </div>

    {isOpen && (
        <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center p-2">
            <div className="relative flex-1">
                <TbCurrencyBaht className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Select value={filters.minSalary} 
                onValueChange={(val) => updateFilter("minSalary", val)}>
                    <SelectTrigger className="pl-8 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Min Salary" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Min Salary</SelectLabel>
                            {salaryRanges.map((salary, idx) => (
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
                    <SelectTrigger className="pl-8 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Max Salary" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Max Salary</SelectLabel>
                            {salaryRanges.map((salary, idx) => (
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
                    <SelectTrigger className="pl-9 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Types</SelectLabel>
                            {types.map((type, idx) => (
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
                    <SelectTrigger className="pl-9 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Job Arrangement" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Arrangements</SelectLabel>
                            {arrangements.map((arrangement, idx) => (
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
                    <SelectTrigger className="pl-9 pr-3 py-2 bg-white rounded-md border-none w-full">
                        <SelectValue placeholder="Date Posted" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Date Posted</SelectLabel>
                        <SelectItem value="Today">Today</SelectItem>
                        <SelectItem value="Part Time">This Week</SelectItem>
                        <SelectItem value="Internship">This Month</SelectItem>
                        <SelectItem value="Internship">Last 3 Months</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
        ) 
    }
    </div>
  );
};

export default JobFilterBar;
