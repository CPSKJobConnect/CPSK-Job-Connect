import { NextResponse } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/admin/job-posts/[id]/route";
import { fetchJobPost } from "@/app/api/admin/job-posts/[id]/fetch.logic";
import { updateJobPost } from "@/app/api/admin/job-posts/[id]/update.logic";
import { deleteJobPost } from "@/app/api/admin/job-posts/[id]/delete.logic";

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { email: "test@example.com", role: "admin" },
  }),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn()
  }
}));

jest.mock("@/app/api/admin/job-posts/[id]/fetch.logic");
jest.mock("@/app/api/admin/job-posts/[id]/update.logic");
jest.mock("@/app/api/admin/job-posts/[id]/delete.logic");

describe("API Admin Job Posts [id] Route", () => {
  const mockParams = { id: "1" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should fetch a job post successfully", async () => {
      const mockJobPost = { id: 1, jobName: "Test Job" };
      (fetchJobPost as jest.Mock).mockResolvedValue(mockJobPost);
      const response = await GET(new Request(""), { params: mockParams });
      expect(fetchJobPost).toHaveBeenCalledWith({ id: "1" });
      expect(NextResponse.json).toHaveBeenCalledWith(mockJobPost, { status: 200 });
    });
  });

  describe("PUT", () => {
    it("should update a job post successfully", async () => {
      const mockUpdatedJobPost = { id: 1, jobName: "Updated Job" };
      (updateJobPost as jest.Mock).mockResolvedValue(mockUpdatedJobPost);
      const mockRequest = new Request("", {
        method: "PUT",
        body: JSON.stringify({ jobName: "Updated Job" }),
        headers: { "Content-Type": "application/json" }
      });
      const response = await PUT(mockRequest, { params: mockParams });
      expect(updateJobPost).toHaveBeenCalledWith({ id: "1" }, { jobName: "Updated Job" });
      expect(NextResponse.json).toHaveBeenCalledWith(mockUpdatedJobPost, { status: 200 });
    });
  });

  describe("DELETE", () => {
    it("should delete a job post successfully", async () => {
      const mockRequest = new Request("", { method: "DELETE" });
      const response = await DELETE(mockRequest, { params: mockParams });
      expect(deleteJobPost).toHaveBeenCalledWith({ id: "1" });
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Successfully deleted" }),
        { status: 200 }
      );
    });
  });
});