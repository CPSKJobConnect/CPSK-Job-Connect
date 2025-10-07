export interface JobInfo {
    id: string;
    companyLogo: string;
    companyBg: string;
    jobName: string;
    companyName: string;
    category: string[];
    location: string;
    posted: string;
    applied: number;
    minSalary: string;
    maxSalary: string;
    tags: string[];
    description: {
      aboutRole: string;
      requirements: string[];
      qualifications: string[];
    };
    type: string;
    arrangement: string;
  }


export interface JobPostFormData {
  title: string;
  department: string;
  location: string;
  type: string;
  arrangement: string;
  minSalary: number;
  maxSalary: number;
  deadline: string;
  skills: string[];
  description: {
    overview: string;
    responsibility: string;
    requirement: string;
    qualification: string;
  }
}

export const defaultJobPostForm: JobPostFormData = {
  title: "",
  department: "",
  location: "",
  type: "",
  arrangement: "",
  minSalary: 0,
  maxSalary: 0,
  deadline: "",
  skills: [],
  description: {
    overview: "",
    responsibility: "",
    requirement: "",
    qualification: "",
  },
};
