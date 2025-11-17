/**
 * Tests for Admin Job Posts [id] Route
 *
 * Endpoints:
 * - GET /api/admin/job-posts/[id] - Fetch job post by ID
 * - PUT /api/admin/job-posts/[id] - Update job post
 * - DELETE /api/admin/job-posts/[id] - Delete job post
 *
 * ASVS Coverage:
 * - V2: Authentication
 * - V4: Access Control (Admin-only)
 */

import { NextResponse } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/admin/job-posts/[id]/route";
import { fetchJobPost } from "@/app/api/admin/job-posts/[id]/fetch.logic";
import { updateJobPost } from "@/app/api/admin/job-posts/[id]/update.logic";
import { deleteJobPost } from "@/app/api/admin/job-posts/[id]/delete.logic";

// Import fixtures
import { mockAdminSession } from "@/tests/fixtures";

// Import mocks
import { silenceConsole, resetAllMocks } from "@/tests/setup/mocks";

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn()
  }
}));

jest.mock("@/app/api/admin/job-posts/[id]/fetch.logic");
jest.mock("@/app/api/admin/job-posts/[id]/update.logic");
jest.mock("@/app/api/admin/job-posts/[id]/delete.logic");

// Silence console logs
silenceConsole();

// ============================================================================
// GET /api/admin/job-posts/[id]
// ============================================================================

describe("API Admin Job Posts [id] Route", () => {
  const mockParams = { id: "1" };

  beforeEach(() => {
    resetAllMocks();
    const { getServerSession } = require("next-auth/next");
    (getServerSession as jest.Mock).mockResolvedValue(mockAdminSession);
  });

  describe("GET", () => {
    it("should fetch a job post successfully", async () => {
      const mockJobPost = { id: 1, jobName: "Test Job" };
      (fetchJobPost as jest.Mock).mockResolvedValue(mockJobPost);
      const response = await GET(new Request("http://localhost/api/admin/job-posts/1"), { params: mockParams });
      expect(fetchJobPost).toHaveBeenCalledWith({ id: "1" });
      expect(NextResponse.json).toHaveBeenCalledWith(mockJobPost, { status: 200 });
    });
  });

  describe("PUT", () => {
    it("should update a job post successfully", async () => {
      const mockUpdatedJobPost = { id: 1, jobName: "Updated Job" };
      (updateJobPost as jest.Mock).mockResolvedValue(mockUpdatedJobPost);
      const mockRequest = new Request("http://localhost/api/admin/job-posts/1", {
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
      const mockRequest = new Request("http://localhost/api/admin/job-posts/1", { method: "DELETE" });
      const response = await DELETE(mockRequest, { params: mockParams });
      expect(deleteJobPost).toHaveBeenCalledWith({ id: "1" });
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Successfully deleted" }),
        { status: 200 }
      );
    });
  });
});