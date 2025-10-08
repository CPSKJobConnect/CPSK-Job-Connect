export interface SalaryRange {
  min: number;
  max: number;
}

export interface JobDescription {
  overview: string;
  responsibility: string;
  requirement: string;
  qualification: string;
}

export interface JobInfo {
  id: string;
  companyLogo: string;
  companyBg: string;
  title: string;
  companyName: string;
  category: string[];
  location: string;
  posted: string;
  applied: number;
  salary: SalaryRange;
  skills: string[];
  description: JobDescription;
  type: string;
  arrangement: string;
  deadline?: string;
}

export interface JobPostFormData {
  title: string;
  department: string;
  location: string;
  type: string;
  arrangement: string;
  salary: SalaryRange;
  deadline: string;
  skills: string[];
  description: JobDescription;
}

export const defaultJobPostForm: JobPostFormData = {
  title: "",
  department: "",
  location: "",
  type: "",
  arrangement: "",
  salary: { min: 0, max: 0 },
  deadline: "",
  skills: [],
  description: {
    overview: "",
    responsibility: "",
    requirement: "",
    qualification: "",
  },
};
