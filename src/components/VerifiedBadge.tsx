import { CheckCircle } from "lucide-react";

interface VerifiedBadgeProps {
  studentStatus: "CURRENT" | "ALUMNI";
  verified?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedBadge({
  studentStatus,
  verified = true,
  size = "md",
  className = "",
}: VerifiedBadgeProps) {
  if (!verified) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const badgeText =
    studentStatus === "CURRENT" ? "Verified KU Student" : "Verified KU Alumni";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        bg-green-100 text-green-800
        rounded-full font-medium
        border border-green-200
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <CheckCircle className={iconSizes[size]} />
      {badgeText}
    </span>
  );
}

interface VerificationStatusBadgeProps {
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationStatusBadge({
  verificationStatus,
  size = "md",
  className = "",
}: VerificationStatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const statusConfig = {
    PENDING: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      border: "border-amber-200",
      label: "⏳ Pending Approval",
    },
    APPROVED: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      label: "✓ Approved",
    },
    REJECTED: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      label: "✗ Rejected",
    },
  };

  const config = statusConfig[verificationStatus];

  return (
    <span
      className={`
        inline-flex items-center
        ${config.bg} ${config.text} ${config.border}
        rounded-full font-medium border
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {config.label}
    </span>
  );
}
