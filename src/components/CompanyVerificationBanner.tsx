"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface CompanyVerificationBannerProps {
  registrationStatus: "PENDING" | "APPROVED" | "REJECTED";
  verificationNotes?: string | null;
}

export function CompanyVerificationBanner({
  registrationStatus,
  verificationNotes,
}: CompanyVerificationBannerProps) {
  // Company pending approval
  if (registrationStatus === "PENDING") {
    return (
      <Alert className="mb-6 border-blue-300 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong className="text-blue-900">⏳ Company Registration Pending Admin Approval</strong>
          <p className="text-blue-800 mt-1">
            Your company registration is under review. You&apos;ll receive an email once an admin
            reviews your company evidence. Job posting will be enabled once approved.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Company rejected
  if (registrationStatus === "REJECTED") {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div>
            <strong>❌ Company Registration Rejected</strong>
            {verificationNotes && (
              <div className="mt-2 p-3 bg-red-100 border-l-4 border-red-600 rounded">
                <p className="text-sm font-medium text-red-900">Reason:</p>
                <p className="text-sm text-red-800 mt-1">{verificationNotes}</p>
              </div>
            )}
            <p className="mt-3 mb-3">
              Please upload new company evidence addressing the issues mentioned above to re-apply for verification.
            </p>
            <Link href="/company/profile">
              <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
                Upload New Evidence
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Company approved
  if (registrationStatus === "APPROVED") {
    return (
      <Alert className="mb-6 border-green-300 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong className="text-green-900">✓ Company Verified</strong>
          <p className="text-green-800 mt-1">
            Your company has been successfully verified. You can now post jobs and manage applications.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface CompanyJobPostingBlockerProps {
  registrationStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export function CompanyJobPostingBlocker({
  registrationStatus,
}: CompanyJobPostingBlockerProps) {
  // Check if company can post jobs
  const canPostJobs = registrationStatus === "APPROVED";

  if (canPostJobs) {
    return null;
  }

  let message = "";
  if (registrationStatus === "PENDING") {
    message = "You must wait for admin approval before posting jobs.";
  } else if (registrationStatus === "REJECTED") {
    message = "Your company registration was rejected. Please re-upload evidence in your profile.";
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
      <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  );
}
