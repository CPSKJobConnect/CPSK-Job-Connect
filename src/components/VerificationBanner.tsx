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
}

export function VerificationBanner({
  emailVerified,
  studentStatus,
  verificationStatus,
  email,
}: VerificationBannerProps) {
  // Current students who haven't verified email
  if (studentStatus === "CURRENT" && !emailVerified) {
    return (
      <Alert className="mb-6 border-amber-300 bg-amber-50">
        <Mail className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong className="text-amber-900">Email Verification Required</strong>
            <p className="text-amber-800 mt-1">
              Please verify your KU email to apply for jobs and access all features.
            </p>
          </div>
          <Link href={`/student/verify-email?email=${encodeURIComponent(email || "")}`}>
            <Button variant="outline" size="sm" className="ml-4">
              Verify Now
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
            reviews your transcript. Job applications are disabled until approval.
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
          <strong>❌ Verification Rejected</strong>
          <p className="mt-1">
            Your alumni verification was rejected. Please contact support for assistance.
          </p>
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
    (studentStatus === "ALUMNI" && verificationStatus === "APPROVED");

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
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
      <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  );
}
