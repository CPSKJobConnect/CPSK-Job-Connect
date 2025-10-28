export const mockCompanyStat = {
  totalJobs: 24,
  activeJobs: 10,
  draftJobs: 4,
  closedJobs: 10,
  totalApplications: 128,
  newApplications: 36,
  pendingApplications: 22,
  reviewedApplications: 40,
  interviewsScheduled: 15,
  offersRejected: 8,
  offersAccepted: 5,
};

export const mockApplicationTrendData = [
  { date: "01/10/2025", applications: 2 },
  { date: "02/10/2025", applications: 4 },
  { date: "03/10/2025", applications: 3 },
  { date: "04/10/2025", applications: 5 },
  { date: "05/10/2025", applications: 6 },
  { date: "06/10/2025", applications: 4 },
  { date: "07/10/2025", applications: 7 },
];

export const mockStatusBreakdown = {
  pending: 5,
  reviewed: 8,
  interviewed: 3,
  accepted: 4,
  rejected: 2,
};

export const mockApplications = [
  {
    id: "1",
    applicant: {
      id: "1",
      name: "Krittin Sukprasert",
      email: "krittin.sukprasert@example.com",
      profile_url: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    job: {
      id: "1",
      title: "Frontend Developer",
    },
    status: "pending",
    applied_at: "2025-01-01T09:00:00Z",
  },
  {
    id: "2",
    applicant: {
      id: "2",
      name: "Thanchida Amornpitakwong",
      email: "thanchida.amornpitakwong@example.com",
      profile_url: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    job: {
      id: "1",
      title: "Frontend Developer",
    },
    status: "accepted",
    applied_at: "2025-01-02T10:00:00Z",
  },
  {
    id: "3",
    applicant: {
      id: "6",
      name: "Sasicha Chaisiri",
      email: "sasicha.chaisiri@example.com",
      profile_url: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    job: {
      id: "2",
      title: "UI/UX Designer",
    },
    status: "accepted",
    applied_at: "2025-01-07T10:45:00Z",
  },
  {
    id: "4",
    applicant: {
      id: "10",
      name: "Anawin Sirichai",
      email: "anawin.sirichai@example.com",
      profile_url: "https://randomuser.me/api/portraits/men/6.jpg",
    },
    job: {
      id: "4",
      title: "Backend Engineer",
    },
    status: "accepted",
    applied_at: "2025-02-05T09:00:00Z",
  },
  {
    id: "5",
    applicant: {
      id: "15",
      name: "Chaiyapol Boonsri",
      email: "chaiyapol.boonsri@example.com",
      profile_url: "https://randomuser.me/api/portraits/men/9.jpg",
    },
    job: {
      id: "5",
      title: "Data Analyst",
    },
    status: "accepted",
    applied_at: "2025-03-03T11:45:00Z",
  },
];

export const mockTopJobs = [
  {
    id: "1",
    title: "Frontend Developer",
    applications: 24,
    status: "active",
  },
  {
    id: "2",
    title: "Backend Engineer",
    applications: 18,
    status: "active",
  },
  {
    id: "3",
    title: "UI/UX Designer",
    applications: 15,
    status: "draft",
  },
  {
    id: "4",
    title: "Data Analyst",
    applications: 12,
    status: "closed",
  },
  {
    id: "5",
    title: "Project Manager",
    applications: 10,
    status: "active",
  },
];
