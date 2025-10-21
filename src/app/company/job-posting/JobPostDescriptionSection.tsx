"use client";
import { Textarea } from "@/components/ui/textarea";
import { JobPostFormData } from "@/types/job";
import SkillCombobox from "../../../components/SkillCombobox";


interface JobPostDescriptionProps {
    formData: JobPostFormData;
    setFormData: React.Dispatch<React.SetStateAction<JobPostFormData>>;
    tags: string[];
}


const JobPostDescriptionSection = ({ formData, setFormData, tags }: JobPostDescriptionProps) => {

    return (
        <div className="flex flex-col gap-6 bg-white p-6 rounded-md shadow-md h-full">
          <div className="bg-gradient-to-r from-[#ABE9D6] to-[#67C3A6] h-[10px] -mx-6 -mt-6 rounded-t-md"></div>
            <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Skills</p>
                <SkillCombobox
                    selectedSkill={formData.skills}
                    setSelectedSkill={(skills) =>
                    setFormData({ ...formData, skills })}
                    existingSkills={tags}
                />

            </div>
            <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Job Summary / Overview</p>
                <Textarea
                name="overview"
                value={formData.description.overview}
                onChange={(e) => setFormData({ ...formData, 
                    description: {
                        ...formData.description,
                        overview: e.target.value
                    }
                })}
                required={true}
                placeholder="Write a short summary of the role..."
                className="border border-gray-200 min-h-[100px]"
                />
            </div>

            <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Responsibilities</p>
                <Textarea
                name="responsibilities"
                value={formData.description.responsibility}
                onChange={(e) => setFormData({ ...formData, 
                    description: {
                        ...formData.description,
                        responsibility: e.target.value
                    }
                })}
                required={true}
                placeholder="List key responsibilities (e.g., Develop features, Write clean code...)"
                className="border border-gray-200 min-h-[120px]"
                />
            </div>

            <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Requirements</p>
                <Textarea
                name="requirements"
                value={formData.description.requirement}
                onChange={(e) => setFormData({ ...formData, 
                    description: {
                        ...formData.description,
                        requirement: e.target.value
                    }
                })}
                required={true}
                placeholder="List nice-to-have requirements (e.g., AWS experience, CI/CD knowledge...)"
                className="border border-gray-200 min-h-[120px]"
                />
            </div>

            <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-semibold text-gray-800">Qualifications</p>
                <Textarea
                name="qualifications"
                value={formData.description.qualification}
                onChange={(e) => setFormData({ ...formData, 
                    description: {
                        ...formData.description,
                        qualification: e.target.value
                    }
                })}
                required={true}
                placeholder="List minimum qualifications (e.g., Bachelor's degree, 2+ years of experience...)"
                className="border border-gray-200 min-h-[120px]"
                />
            </div>
        </div>
    );
}
export default JobPostDescriptionSection ;