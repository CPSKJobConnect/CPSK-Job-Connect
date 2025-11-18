import { GET, PUT } from "@/app/api/students/[id]/route";
import { prisma } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/api-auth", () => ({
  getApiSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("GET /api/students/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 if session has no user ID", async () => {
      (getApiSession as jest.Mock).mockResolvedValue({ user: {} });

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Fetching student profile", () => {
    const mockSession = {
      user: { id: "1", email: "student@example.com" },
    };

    const mockStudent = {
      id: 10,
      account_id: 1,
      student_id: "S001",
      name: "John Doe",
      faculty: "Engineering",
      year: "3",
      phone: "1234567890",
      account: {
        email: "student@example.com",
        logoUrl: "http://example.com/logo.png",
        backgroundUrl: "http://example.com/bg.png",
        documents: [
          { id: 1, doc_type_id: 1, file_path: "/resume.pdf", file_name: "resume.pdf", created_at: new Date("2024-01-01") },
          { id: 2, doc_type_id: 2, file_path: "/cv.pdf", file_name: "cv.pdf", created_at: new Date("2024-01-02") },
        ],
      },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should return student profile successfully", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(10);
      expect(data.email).toBe("student@example.com");
      expect(data.student_id).toBe("S001");
    });

    it("should split name into firstname and lastname", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(data.firstname).toBe("John");
      expect(data.lastname).toBe("Doe");
    });

    it("should handle Alumni year value", async () => {
      const alumniStudent = { ...mockStudent, year: "Alumni" };
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(alumniStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(data.year).toBe("Alumni");
    });

    it("should convert numeric year to number", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(data.year).toBe(3);
      expect(typeof data.year).toBe("number");
    });

    it("should categorize documents by type", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(data.documents.resume).toHaveLength(1);
      expect(data.documents.cv).toHaveLength(1);
      expect(data.documents.portfolio).toHaveLength(0);
      expect(data.documents.transcript).toHaveLength(0);
    });

    it("should return 404 if student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });

    it("should handle null logoUrl and backgroundUrl", async () => {
      const studentWithoutImages = {
        ...mockStudent,
        account: { ...mockStudent.account, logoUrl: null, backgroundUrl: null },
      };
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(studentWithoutImages);

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(data.profile_url).toBe("");
      expect(data.bg_profile_url).toBe("");
    });

    it("should handle database errors", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/students/1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch student");
    });
  });
});

describe("PUT /api/students/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 if not authenticated", async () => {
      (getApiSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({ name: "Test", faculty: "CS", year: 3, phone: "123" }),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Updating student profile", () => {
    const mockSession = {
      user: { id: "1", email: "student@example.com" },
    };

    const mockStudent = {
      id: 10,
      account_id: 1,
    };

    const mockUpdatedStudent = {
      id: 10,
      account_id: 1,
      student_id: "S001",
      name: "Jane Smith",
      faculty: "Science",
      year: "4",
      phone: "9876543210",
      account: {
        email: "student@example.com",
        logoUrl: null,
        backgroundUrl: null,
        documents: [],
      },
    };

    beforeEach(() => {
      (getApiSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it("should update student profile successfully", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.student.update as jest.Mock).mockResolvedValue(mockUpdatedStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({
          name: "Jane Smith",
          faculty: "Science",
          year: 4,
          phone: "9876543210",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.firstname).toBe("Jane");
      expect(data.lastname).toBe("Smith");
      expect(data.faculty).toBe("Science");
      expect(data.phone).toBe("9876543210");
    });

    it("should return 400 if name is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({ faculty: "CS", year: 3, phone: "123" }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
      expect(data.fields).toContain("name");
    });

    it("should return 400 if faculty is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({ name: "Test", year: 3, phone: "123" }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContain("faculty");
    });

    it("should return 400 if year is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({ name: "Test", faculty: "CS", phone: "123" }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContain("year");
    });

    it("should return 400 if phone is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({ name: "Test", faculty: "CS", year: 3 }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContain("phone");
    });

    it("should return 404 if student not found", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({
          name: "Test",
          faculty: "CS",
          year: 3,
          phone: "123",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Student not found");
    });

    it("should update account username with student name", async () => {
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (prisma.student.update as jest.Mock).mockResolvedValue(mockUpdatedStudent);

      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({
          name: "Jane Smith",
          faculty: "Science",
          year: 4,
          phone: "9876543210",
        }),
      });

      await PUT(request);

      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            account: {
              update: {
                username: "Jane Smith",
              },
            },
          }),
        })
      );
    });

    it("should handle database errors", async () => {
      (prisma.student.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/students/1", {
        method: "PUT",
        body: JSON.stringify({
          name: "Test",
          faculty: "CS",
          year: 3,
          phone: "123",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update student profile");
    });
  });
});
