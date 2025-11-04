"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";

interface VerificationBannerProps {
  emailVerified: boolean;
  studentStatus: "CURRENT" | "ALUMNI";
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  email?: string;
  rejectionReason?: string | null;
}

export function VerificationBanner({
  emailVerified,
  studentStatus,
  verificationStatus,
  email,
  rejectionReason,
}: VerificationBannerProps) {
  // Current students who haven't verified email
  if (studentStatus === "CURRENT" && !emailVerified) {
    return (
      <Alert className="mb-6 border-blue-300 bg-blue-50">
        <Mail className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong className="text-blue-900">📧 Email Verification Needed</strong>
            <p className="text-blue-800 mt-1">
              Verify your KU email to unlock job applications. You can browse jobs while waiting!
            </p>
          </div>
          <Link href={`/student/verify-email?email=${encodeURIComponent(email || "")}`}>
            <Button className="ml-4 bg-blue-600 hover:bg-blue-700">
              Verify Email
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Alumni pending approval
  if (studentStatus === "ALUMNI" && verificationStatus === "PENDING") {
    return (
      <Alert className="mb-6 border-blue-300 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong className="text-blue-900">⏳ Account Pending Admin Approval</strong>
          <p className="text-blue-800 mt-1">
            Your alumni verification is under review. You&apos;ll receive an email once an admin
            reviews your transcript. You can browse jobs, but applications are disabled until approval.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Alumni rejected
  if (studentStatus === "ALUMNI" && verificationStatus === "REJECTED") {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div>
            <strong>❌ Verification Rejected</strong>
            {rejectionReason && (
              <div className="mt-2 p-3 bg-red-100 border-l-4 border-red-600 rounded">
                <p className="text-sm font-medium text-red-900">Reason:</p>
                <p className="text-sm text-red-800 mt-1">{rejectionReason}</p>
              </div>
            )}
            <p className="mt-3 mb-3">
              Please upload a new transcript addressing the issues mentioned above to re-apply for verification.
            </p>
            <Link href="/student/profile">
              <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
                Upload New Transcript
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Alumni approved but email not verified
  if (studentStatus === "ALUMNI" && verificationStatus === "APPROVED" && !emailVerified) {
    return (
      <Alert className="mb-6 border-green-300 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <Link href={`/student/verify-email?email=${encodeURIComponent(email || "")}`} className="hover:underline">
              <strong className="text-green-900 cursor-pointer">✅ Verification Approved - Email Verification Required</strong>
            </Link>
            <p className="text-green-800 mt-1">
              Your alumni status has been approved! Click "Verify Email" to receive a verification code and complete registration.
            </p>
          </div>
          <Link href={`/student/verify-email?email=${encodeURIComponent(email || "")}`}>
            <Button className="ml-4 bg-green-600 hover:bg-green-700">
              Verify Email
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // All verified - show success message (optional)
  if (emailVerified && verificationStatus === "APPROVED") {
    return (
      <Alert className="mb-6 border-green-300 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong className="text-green-900">✓ Account Verified</strong>
          <p className="text-green-800 mt-1">
            Your account is fully verified. You can browse and apply for jobs.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface JobApplicationBlockerProps {
  emailVerified: boolean;
  studentStatus: "CURRENT" | "ALUMNI";
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export function JobApplicationBlocker({
  emailVerified,
  studentStatus,
  verificationStatus,
}: JobApplicationBlockerProps) {
  // Check if student can apply
  const canApply =
    (studentStatus === "CURRENT" && emailVerified) ||
    (studentStatus === "ALUMNI" && verificationStatus === "APPROVED" && emailVerified);

  if (canApply) {
    return null;
  }

  let message = "";
  if (studentStatus === "CURRENT" && !emailVerified) {
    message = "You must verify your KU email before applying for jobs.";
  } else if (studentStatus === "ALUMNI" && verificationStatus === "PENDING") {
    message = "You cannot apply for jobs until an admin approves your alumni verification.";
  } else if (studentStatus === "ALUMNI" && verificationStatus === "REJECTED") {
    message = "Your verification was rejected. Please contact support.";
  } else if (studentStatus === "ALUMNI" && verificationStatus === "APPROVED" && !emailVerified) {
    message = "You must verify your KU email before applying for jobs.";
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
      <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  );
}
