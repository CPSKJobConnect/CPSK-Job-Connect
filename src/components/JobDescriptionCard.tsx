"use client";

interface JobDescriptionProps {
  companyLogo: string;
  jobName: string;
  companyName: string;
  tags: string[];
  description: string;
  type: "fulltime" | "internship" | "parttime";
  role: "student" | "company";
  onApply?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const JobDescriptionCard = ({companyLogo, jobName, companyName, tags, 
    description, type, role, 
    onApply, onSave, onEdit, onDelete,}: JobDescriptionProps) => {
        
  return (
  <div></div>
  );
};

export default JobDescriptionCard;
