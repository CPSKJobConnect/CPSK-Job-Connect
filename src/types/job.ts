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

// export interface JobInfo {
//     id: string;
//     companyLogo: string;
//     companyBg: string;
//     jobName: string;
//     companyName: string;
//     category: string[];
//     location: string;
//     posted: string;
//     applied: number;
//     minSalary: string;
//     maxSalary: string;
//     tags: string[];
//     description: {
//       aboutRole: string;
//       requirements: string[];
//       qualifications: string[];
//     };
//     type: string;
//     arrangement: string;
//   }


// export interface JobPostFormData {
//   title: string;
//   department: string;
//   location: string;
//   type: string;
//   arrangement: string;
//   minSalary: number;
//   maxSalary: number;
//   deadline: string;
//   skills: string[];
//   description: {
//     overview: string;
//     responsibility: string;
//     requirement: string;
//     qualification: string;
//   }
// }

// export const defaultJobPostForm: JobPostFormData = {
//   title: "",
//   department: "",
//   location: "",
//   type: "",
//   arrangement: "",
//   minSalary: 0,
//   maxSalary: 0,
//   deadline: "",
//   skills: [],
//   description: {
//     overview: "",
//     responsibility: "",
//     requirement: "",
//     qualification: "",
//   },
// };
