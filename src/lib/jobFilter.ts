import { JobInfo } from "@/types/job";
import { getDiffDays } from "./dateHelper";

export type JobFilters = {
  keyword?: string;
  jobCategory?: string;
  location?: string;
  jobType?: string;
  jobArrangement?: string;
  minSalary?: number;
  maxSalary?: number;
  datePost?: string;
};

export function filterByKeyword(jobs: JobInfo[], keyword?: string) {
  if (!keyword) return jobs;
  return jobs.filter(job =>
    job.title.toLowerCase().includes(keyword.toLowerCase())
  );
}

export function filterByCategory(jobs: JobInfo[], category?: string) {
  if (!category) return jobs;
  return jobs.filter(job => job.category.includes(category));
}

export function filterByLocation(jobs: JobInfo[], location?: string) {
  if (!location) return jobs;
  return jobs.filter(job => job.location === location);
}

export function filterByType(jobs: JobInfo[], type?: string) {
  if (!type) return jobs;
  return jobs.filter(job => job.type === type);
}

export function filterByArrangement(jobs: JobInfo[], arrangement?: string) {
  if (!arrangement) return jobs;
  return jobs.filter(job => job.arrangement === arrangement);
}

export function filterByMinSalary(jobs: JobInfo[], minSalary?: number) {
  if (!minSalary) return jobs;
  return jobs.filter(job => Number(job.salary.min) >= Number(minSalary));
}

export function filterByMaxSalary(jobs: JobInfo[], maxSalary?: number) {
  if (!maxSalary) return jobs;
  return jobs.filter(job => Number(job.salary.max) <= Number(maxSalary));
}

export function filterByDatePost(jobs: JobInfo[], datePost?: string) {
  if (!datePost) return jobs;
  return jobs.filter(job => {
    const diffDays = getDiffDays(job.posted);
    switch (datePost) {
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

export function filterJobs(jobs: JobInfo[], filters: JobFilters): JobInfo[] {
  let result = jobs;
  result = filterByKeyword(result, filters.keyword);
  result = filterByCategory(result, filters.jobCategory);
  result = filterByLocation(result, filters.location);
  result = filterByType(result, filters.jobType);
  result = filterByArrangement(result, filters.jobArrangement);
  result = filterByMinSalary(result, filters.minSalary);
  result = filterByMaxSalary(result, filters.maxSalary);
  result = filterByDatePost(result, filters.datePost);

  return result;
}
