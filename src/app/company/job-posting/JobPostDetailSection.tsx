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
import CategoryCombobox from "@/components/CategoryCombobox";
import LocationCombobox from "@/components/LocationCombobox";
import { JobPostFormData} from "@/types/job";


interface JobPostDetailProps {
  formData: JobPostFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobPostFormData>>;
  categories: string[];
  locations: string[];
  types: string[];
  arrangements: string[];
}


const JobPostDetailSection = ({ formData, setFormData, categories, locations, types, arrangements }: JobPostDetailProps) => {
  const [locationList, setLocationList] = useState<string[]>([]);
  const [jobTypeList, setJobTypeList] = useState<string[]>([]);
  const [jobArrangementList, setJobArrangementList] = useState<string[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);

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
                  categoryList={categories}
                />
              </div>
            </div>

            <div className="flex flex-row gap-6">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Location</p>
                <LocationCombobox
                    value={formData.location}
                    showIcon={false}
                    onChange={(value) => setFormData({ ...formData, location: value })}
                />
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
                            {types.map((type) => (
                            <SelectItem key={type} value={type}>
                            {type}
                        </SelectItem>
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
                    {arrangements.map((arr) => (
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
                  type="number"
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
                  type="number"
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