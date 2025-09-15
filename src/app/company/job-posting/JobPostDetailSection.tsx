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
import { mockCompanies } from "@/mockCompany";
import { JobPostFormData} from "@/types/job";


interface JobPostDetailProps {
  formData: JobPostFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobPostFormData>>;
}


const JobPostDetailSection = ({ formData, setFormData }: JobPostDetailProps) => {
      const [departmentList, setDepartmentList] = useState<string[]>([])
      const [locationList, setLocationmentList] = useState<string[]>([])
    
      useEffect(() => {
        setDepartmentList(mockCompanies[0].department);
        setLocationmentList(mockCompanies[0].address);
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
                <p className="text-sm font-semibold text-gray-800">Department</p>
                <Select onValueChange={(value) => handleSelect("department", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentList.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value='fulltime'>Full Time</SelectItem>
                    <SelectItem value='parttime'>Part Time</SelectItem>
                    <SelectItem value='internship'>Internship</SelectItem>
                    <SelectItem value='freerance'>Freelance</SelectItem>
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
                    <SelectItem value='onsite'>Onsite</SelectItem>
                    <SelectItem value='hybrid'>Hybrid</SelectItem>
                    <SelectItem value='remote'>Remote</SelectItem>
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
                  value={formData.minSalary}
                  onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
                  required={true}
                  placeholder="30000"
                />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Max Salary</p>
                <Input
                  type="text"
                  name="maxSalary"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData({ ...formData, maxSalary: Number(e.target.value) })}
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