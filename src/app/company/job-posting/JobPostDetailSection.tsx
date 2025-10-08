"use client";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockCompanies } from "public/data/mockCompany";
import CategoryCombobox from "@/components/CategoryCombobox";
import { JobPostFormData} from "@/types/job";
import { mockJobType, mockJobArrangement } from "public/data/fakeFilterInfo";


interface JobPostDetailProps {
  formData: JobPostFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobPostFormData>>;
}


const JobPostDetailSection = ({ formData, setFormData }: JobPostDetailProps) => {
      const [locationList, setLocationmentList] = useState<string[]>([])
      const [jobTypeList, setJobTypeList] = useState<string[]>([]);
      const [jobArrangementList, setJobArrangementList] = useState<string[]>([]);

      useEffect(() => {
        setLocationmentList(mockCompanies[0].address);
        setJobTypeList(mockJobType);
        setJobArrangementList(mockJobArrangement);
      }, [])
    
      const handleSelect = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

    return (
        <div className="flex flex-col gap-6 bg-white p-6 rounded-md shadow-md h-full">
          <div className="bg-gradient-to-r from-[#ABE9D6] to-[#67C3A6] h-[10px] -mx-6 -mt-6 rounded-t-md"></div>
            <div className="flex flex-row gap-6">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Job Title</p>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required={true}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Job Category</p>
                <CategoryCombobox
                  selectedCategory={formData.category}
                  setSelectedCategory={(category) => setFormData({ ...formData, category })}
                  placeholder="e.g. Engineer, Finance"
                />
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Location</p>
                <Select onValueChange={(value) => handleSelect("location", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationList.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Type</p>
                <Select onValueChange={(value) => handleSelect("type", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypeList.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Arrangement</p>
                <Select onValueChange={(value) => handleSelect("arrangement", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobArrangementList.map((arr) => (
                      <SelectItem key={arr} value={arr}>{arr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Min Salary</p>
                <Input
                  type="text"
                  name="minSalary"
                  value={formData.salary.min}
                  onChange={(e) => setFormData({ ...formData, 
                    salary: {
                      ...formData.salary,
                      min: Number(e.target.value)
                  }})}
                  required={true}
                  placeholder="30000"
                />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Max Salary</p>
                <Input
                  type="text"
                  name="maxSalary"
                  value={formData.salary.max}
                  onChange={(e) => setFormData({ ...formData, 
                    salary: {
                      ...formData.salary,
                      max: Number(e.target.value)
                  }})}
                  required={true}
                  placeholder="60000"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Deadline</p>
                <Input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required={true}
                />
            </div>
        </div>
    );
}
export default JobPostDetailSection;