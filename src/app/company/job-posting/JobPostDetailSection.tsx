"use client";
import { Input } from "@/components/ui/input";
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
  types: string[];
  arrangements: string[];
}


const JobPostDetailSection = ({ formData, setFormData, categories, types, arrangements }: JobPostDetailProps) => {

    const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

    return (
        <div className="flex flex-col gap-6 bg-white p-6 rounded-md shadow-md h-full">
          <div className="bg-linear-to-r from-[#ABE9D6] to-[#67C3A6] h-2.5 -mx-6 -mt-6 rounded-t-md"></div>
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
                  className="w-full bg-white justify-between text-gray-700"
                />
              </div>
            </div>

            <div className="flex flex-row gap-6">
                <div className="flex flex-col gap-2 w-full">
                    <p className="text-sm font-semibold text-gray-800">Type</p>
                    <Select onValueChange={(value) => handleSelect("type", value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={formData.type || "Select Type"} />
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
                    <SelectValue placeholder={formData.arrangement || "Select Arrangement"} />
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
                <p className="text-sm font-semibold text-gray-800">Min Salary (THB)</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">฿</span>
                  <Input
                    type="number"
                    min={0}
                    name="minSalary"
                    value={formData.salary.min || ""}
                    onChange={(e) => setFormData({ ...formData,
                      salary: {
                        ...formData.salary,
                        min: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value))
                    }})}
                    required={true}
                    placeholder="30000"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Max Salary (THB)</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">฿</span>
                  <Input
                    type="number"
                    min={0}
                    name="maxSalary"
                    value={formData.salary.max || ""}
                    onChange={(e) => setFormData({ ...formData,
                      salary: {
                        ...formData.salary,
                        max: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value))
                    }})}
                    required={true}
                    placeholder="60000"
                    className="pl-8"
                  />
                </div>
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
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Required Documents</h3>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'resume', label: 'Resume' },
                  { key: 'cv', label: 'CV' },
                  { key: 'portfolio', label: 'Portfolio' },
                  { key: 'transcript', label: 'Transcript' },
                ].map((doc) => {
                  const checked = formData.documents?.includes(doc.key) ?? false;
                  return (
                    <label key={doc.key} className="inline-flex items-center gap-3">
                      <input
                        data-testid={`reqdoc-${doc.key}`}
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const list = new Set(prev.documents || []);
                            if (e.target.checked) list.add(doc.key);
                            else list.delete(doc.key);
                            return { ...prev, documents: Array.from(list) };
                          });
                        }}
                      />
                      <span className="text-sm text-gray-700">{doc.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
        </div>
    );
}
export default JobPostDetailSection;