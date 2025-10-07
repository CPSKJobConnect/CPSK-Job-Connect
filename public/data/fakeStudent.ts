import { Student } from "@/types/user";

const mockStudents: Student[] = [
  {
    id: 1,
    account_id: 101,
    profile_url: "https://randomuser.me/api/portraits/women/1.jpg",
    bg_profile_url: "https://picsum.photos/800/200?random=1",
    email: "johnsonstudent@ku.th",
    role: "student",
    student_id: "S2024001",
    firstname: "Alice",
    lastname: "Johnson",
    faculty: "Engineering",
    year: 2,
    phone: "0812345671",
    documents: {
      resume: [
        { url: "/files/alice_resume.pdf", name: "alice_resume.pdf", uploadedAt: new Date("2025-01-10") }
      ],
      cv: [
        { url: "/files/alice_cv.pdf", name: "alice_cv.pdf", uploadedAt: new Date("2025-01-11") }
      ],
      portfolio: []
    }
  },
  {
    id: 2,
    account_id: 102,
    firstname: "Bob",
    lastname: "Smith",
    email: "smithbob@ku.th",
    profile_url: "https://randomuser.me/api/portraits/men/2.jpg",
    bg_profile_url: "https://picsum.photos/800/200?random=2",
    role: "student",
    student_id: "S2024002",
    faculty: "Business",
    year: 3,
    phone: "0812345672",
    documents: {
      resume: [
        { url: "/files/bob_resume.pdf", name: "bob_resume.pdf", uploadedAt: new Date("2025-01-12") }
      ],
      cv: [],
      portfolio: [
        { url: "/files/bob_portfolio.pdf", name: "bob_portfolio.pdf", uploadedAt: new Date("2025-01-13") }
      ]
    }
  },
  {
    id: 3,
    account_id: 103,
    firstname: "Charlie",
    lastname: "Lee",
    email: "charlielee@ku.th",
    profile_url: "https://randomuser.me/api/portraits/men/3.jpg",
    bg_profile_url: "https://picsum.photos/800/200?random=3",
    role: "student",
    student_id: "S2024003",
    faculty: "Science",
    year: 1,
    phone: "0812345673",
    documents: {
      resume: [],
      cv: [
        { url: "/files/charlie_cv.pdf", name: "charlie_cv.pdf", uploadedAt: new Date("2025-01-14") }
      ],
      portfolio: []
    }
  },
  {
    id: 4,
    account_id: 104,
    firstname: "Diana",
    lastname: "Green",
    email: "dianagreen@ku.th",
    profile_url: "https://randomuser.me/api/portraits/women/4.jpg",
    bg_profile_url: "https://picsum.photos/800/200?random=4",
    role: "student",
    student_id: "S2024004",
    faculty: "Arts",
    year: 4,
    phone: "0812345674",
    documents: {
      resume: [
        { url: "/files/diana_resume.pdf", name: "diana_resume.pdf", uploadedAt: new Date("2025-01-15") }
      ],
      cv: [],
      portfolio: [
        { url: "/files/diana_portfolio.pdf", name: "diana_portfolio.pdf", uploadedAt: new Date("2025-01-16") }
      ]
    }
  },
  {
    id: 5,
    account_id: 105,
    firstname: "Ethan",
    lastname: "Brown",
    email: "ethanbrown@ku.th",
    profile_url: "https://randomuser.me/api/portraits/men/5.jpg",
    bg_profile_url: "https://picsum.photos/800/200?random=5",
    role: "student",
    student_id: "S2024005",
    faculty: "Engineering",
    year: 2,
    phone: "0812345675",
    documents: {
      resume: [],
      cv: [],
      portfolio: [
        { url: "/files/ethan_portfolio.pdf", name: "ethan_portfolio.pdf", uploadedAt: new Date("2025-01-17") }
      ]
    }
  }
];

export default mockStudents;
