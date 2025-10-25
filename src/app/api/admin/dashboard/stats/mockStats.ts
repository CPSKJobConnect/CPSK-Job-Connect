export const mockStats = {
  pendingCompanies: 5,
  totalJobPosts: 120,
  totalStudents: 450,
  totalCompanies: 40,
  reportedPosts: 3,
  averageSalary: {
    min: 25000,
    max: 70000,
    overall: 47500,
  },
  topHiringCompanies: [
    { id: 1, name: "Acme Corp", jobPostsCount: 12, totalApplications: 34 },
    { id: 2, name: "Globex", jobPostsCount: 8, totalApplications: 20 },
    { id: 3, name: "Umbrella Inc.", jobPostsCount: 5, totalApplications: 12 },
  ],
  successRateByDepartment: [
    { faculty: "SKE", totalStudents: 200, acceptedApplications: 50, successRate: 25 },
    { faculty: "CPE", totalStudents: 150, acceptedApplications: 60, successRate: 40 },
  ],
  topSkills: [
    { name: "React", count: 45 },
    { name: "Node.js", count: 38 },
    { name: "Python", count: 33 },
  ],
  recentReports: [
    { id: 101, type: "Spam", createdAt: "2025-10-19T14:22:00Z", reporterEmail: "user1@example.com" },
    { id: 102, type: "Inappropriate content", createdAt: "2025-10-19T15:10:00Z", reporterEmail: "user2@example.com" },
  ],
};
