"use client";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JobPostFormData} from "@/types/job";


interface JobPostDetailProps {
  formData: JobPostFormData;
  setFormData: React.Dispatch<React.SetStateAction<JobPostFormData>>;
  jobTypes: { id: number; name: string }[];
  jobArrangements: { id: number; name: string }[];
  jobCategories: { id: number; name: string }[];
}


const JobPostDetailSection = ({
  formData,
  setFormData,
  jobTypes,
  jobArrangements,
  jobCategories,
}: JobPostDetailProps) => {

  useEffect(() => {
    if (!formData.department && jobCategories.length > 0) {
      setFormData((prev) => ({ ...prev, department: jobCategories[0].name }));
    }
    if (!formData.type && jobTypes.length > 0) {
      setFormData((prev) => ({ ...prev, type: jobTypes[0].name }));
    }
    if (!formData.arrangement && jobArrangements.length > 0) {
      setFormData((prev) => ({ ...prev, arrangement: jobArrangements[0].name }));
    }
  }, [jobCategories, jobTypes, jobArrangements, formData, setFormData]);

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
                <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelect("department", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department"/>
                  </SelectTrigger>
                  <SelectContent>
                    {jobCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          <div className="flex flex-row gap-6">
            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm font-semibold text-gray-800">Location</p>
              <Input
                type="text"
                name="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required={true}
                placeholder="e.g. Bangkok, Thailand"
              />
            </div>
          </div>

          <div className="flex flex-row gap-6">
            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm font-semibold text-gray-800">Type</p>
              <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelect("type", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type"/>
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm font-semibold text-gray-800">Arrangement</p>
              <Select
                  value={formData.arrangement}
                  onValueChange={(value) => handleSelect("arrangement", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Arrangement"/>
                </SelectTrigger>
                <SelectContent>
                  {jobArrangements.map((arr) => (
                      <SelectItem key={arr.id} value={arr.name}>
                        {arr.name}
                      </SelectItem>
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
                  value={formData.minSalary}
                  onChange={(e) => setFormData({...formData, minSalary: Number(e.target.value)})}
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