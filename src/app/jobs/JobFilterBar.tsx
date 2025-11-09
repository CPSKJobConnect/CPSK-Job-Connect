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
import LocationCombobox from "@/components/LocationCombobox";
import { JobFilterInfo } from "@/types/filter";
import { useState } from "react";
import { BiCategory } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { IoIosArrowDown, IoMdSearch } from "react-icons/io";
import { LuFilter, LuTags } from "react-icons/lu";
import { MdOutlineDateRange } from "react-icons/md";
import { TbCurrencyBaht } from "react-icons/tb";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
    keyword: "", // TypeScript error: number instead of string
    jobCategory: "",
    location: "",
    jobType: "",
    jobArrangement: "",
    minSalary: "",
    maxSalary: "",
    datePost: "",
  };


  const [filters, setFilters] = useState<JobFilters>(defaultFilters);

  const updateFilter = (field: string, value: string) => {
    setFilters((prev) => ({...prev, [field]: value}))
  };

  const handleClearAll = () => {
    setFilters(defaultFilters);
    if (onSearch) onSearch(defaultFilters);
  };

  const handleSearch = () => {
    if (onSearch) onSearch(filters);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full h-auto rounded-2xl p-4 bg-white">
        <div className="flex flex-col mb-4">
            <p className="font-semibold text-2xl text-gray-800">
                Find Your Dream Job
            </p>
            <p className="text-gray-600 text-sm mt-1">
                Discover opportunities that match your skills and aspirations
            </p>
        </div>
        <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-md border border-gray-100">
            <div className="relative flex-1 pr-4">
                <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Job title or keyword"
                    value={filters.keyword}
                    data-testid="job-keyword-input"
                    onChange={(e) => updateFilter("keyword", e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-3 py-3 rounded-full border-none shadow-none focus:ring-0 focus:outline-none text-sm"
                />
            </div>

            <div className="hidden sm:flex items-center h-10 border-l border-gray-200 pl-4 mr-4 min-w-[220px]">
                <IoLocationOutline className="text-gray-400 mr-3" />
                <LocationCombobox
                    value={filters.location}
                    showIcon={true}
                    onChange={(val) => updateFilter("location", val)}
                />
            </div>

            <button
                data-testid="search-button"
                onClick={handleSearch}
                className="ml-auto bg-[#2BA17C] text-white font-semibold rounded-full px-6 py-2 shadow-lg hover:brightness-95 transition"
            >
                <p className="text-white text-sm font-bold">Search</p>
            </button>
            <Sheet>
                <SheetTrigger asChild>
                    <button
                        data-testid="filters-trigger"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="p-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                        <LuFilter className="w-4 h-4 text-[#006C67]" />
                        <p className="text-[#006C67] text-sm font-bold">Filters</p>
                        <IoIosArrowDown className="w-4 h-4 text-[#006C67]" />
                    </button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto p-6">
                    <SheetHeader>
                        <SheetTitle className="text-lg font-semibold">Filter Jobs</SheetTitle>
                        <SheetDescription className="text-sm text-gray-500">
                            Refine your job search with advanced filters
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mx-auto grid grid-cols-1 gap-10 items-start w-full">
                        <div className="relative w-full p-1">
                            <BiCategory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                            <Select value={filters.jobCategory} 
                            onValueChange={(val) => updateFilter("jobCategory", val)}>
                                <SelectTrigger data-testid="select-job-category" className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full cursor-pointer">
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

                        <div className="relative w-full p-1">
                            <TbCurrencyBaht className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Select value={filters.minSalary} 
                            onValueChange={(val) => updateFilter("minSalary", val)}>
                                <SelectTrigger data-testid="select-min-salary" className="pl-8 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
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
                        
                        <div className="relative w-full p-1">
                            <TbCurrencyBaht className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Select value={filters.maxSalary} 
                            onValueChange={(val) => updateFilter("maxSalary", val)}>
                                <SelectTrigger data-testid="select-max-salary" className="pl-8 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
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

                        <div className="relative w-full p-1">
                            <LuTags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Select value={filters.jobType} 
                            onValueChange={(val) => updateFilter("jobType", val)}>
                                <SelectTrigger data-testid="select-job-type" className="pl-9 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
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

                        <div className="relative w-full p-1">
                            <LuTags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Select value={filters.jobArrangement} 
                            onValueChange={(val) => updateFilter("jobArrangement", val)}>
                                <SelectTrigger data-testid="select-job-arrangement" className="pl-9 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
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

                        <div className="relative w-full p-1">
                            <MdOutlineDateRange className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Select value={filters.datePost} 
                            onValueChange={(val) => updateFilter("datePost", val)}>
                                <SelectTrigger data-testid="select-date-post" className="pl-9 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full">
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
                    <SheetFooter>
                        <div className="max-w-4xl mx-auto w-full flex items-center justify-end gap-3 p-4">
                            <button
                                data-testid="clear-filters-button"
                                onClick={handleClearAll}
                                className="px-4 py-2 rounded-full w-full border border-green-600 text-green-600 bg-white hover:bg-green-50 transition"
                            >
                            Clear All
                            </button>

                            <SheetClose asChild>
                                <button
                                data-testid="apply-filters-button"
                                onClick={handleSearch}
                                className="px-5 py-2 rounded-full w-full bg-[#2BA17C] text-white font-semibold shadow-md hover:brightness-95 transition"
                                >
                                Apply Filters
                                </button>
                            </SheetClose>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    </div>
  );
};

export default JobFilterBar;
