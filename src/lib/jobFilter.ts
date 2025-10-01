import { JobInfo } from "@/types/job"
import { getDiffDays } from "./dateHelper"

export type JobFilters = {
    keyword?: string
    jobCategory?: string
    location?: string
    jobType?: string
    jobArrangement?: string
    minSalary?: number
    maxSalary?: number
    datePost?: string
}

export function filterJobs(jobs: JobInfo[], filters: JobFilters): JobInfo[] {
    let result = jobs
  
    if (filters.keyword) {
        result = result.filter((job) =>
          job.title.toLowerCase().includes((filters.keyword ?? "").toLowerCase()),
        );
      }
  
      if (filters.jobCategory) {
        result = result.filter((job) =>
          job.category.includes(filters.jobCategory ?? ""),
        );
      }
  
      if (filters.location) {
        result = result.filter((job) => job.location === filters.location);
      }
  
      if (filters.jobType) {
        result = result.filter((job) => job.type === filters.jobType);
      }
  
      if (filters.jobArrangement) {
        result = result.filter((job) => job.arrangement === filters.jobArrangement);
      }
  
      if (filters.minSalary) {
        result = result.filter(
          (job) =>
            Number(job.salary.min) >= Number(filters.minSalary),
        );
      }
  
      if (filters.maxSalary) {
        result = result.filter(
          (job) =>
            Number(job.salary.max) <= Number(filters.maxSalary),
        );
      }
  
      if (filters.datePost) {      
        result = result.filter((job) => {
          const diffDays = getDiffDays(job.posted);
      
          switch (filters.datePost) {
            case "today":
              return diffDays === 0;
            case "3days":
              return diffDays <= 3;
            case "5days":
              return diffDays <= 5;
            case "week":
              return diffDays <= 7;
            case "2weeks":
              return diffDays <= 14;
            default:
              return true;
          }
        });
      }
  
    return result
}  