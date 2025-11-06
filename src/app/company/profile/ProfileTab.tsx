"use client";

import { Company } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IoBusinessOutline, IoCallOutline, IoGlobeOutline, IoLocationOutline, IoMailOutline, IoShieldCheckmarkOutline } from "react-icons/io5";

interface ProfileTabProps {
  company: Company;
}

export default function ProfileTab({ company }: ProfileTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Verified";
      case "PENDING":
        return "Verification Pending";
      case "REJECTED":
        return "Verification Rejected";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>View your company profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <IoShieldCheckmarkOutline className="w-6 h-6 text-gray-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Verification Status</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(company.registration_status)}`}>
              {getStatusText(company.registration_status)}
            </span>
          </div>
        </div>

        {/* Company Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoBusinessOutline className="w-4 h-4" />
              <span>Company Name</span>
            </div>
            <p className="text-base text-gray-900 pl-6">{company.name}</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoMailOutline className="w-4 h-4" />
              <span>Email</span>
            </div>
            <p className="text-base text-gray-900 pl-6">{company.email}</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoCallOutline className="w-4 h-4" />
              <span>Phone</span>
            </div>
            <p className="text-base text-gray-900 pl-6">{company.phone}</p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoLocationOutline className="w-4 h-4" />
              <span>Address</span>
            </div>
            <p className="text-base text-gray-900 pl-6">{company.address.join(", ")}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <IoGlobeOutline className="w-4 h-4" />
            <span>Company Description</span>
          </div>
          <p className="text-base text-gray-900 pl-6 whitespace-pre-wrap">{company.description}</p>
        </div>

        {/* Status-specific messages */}
        {company.registration_status === "PENDING" && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm font-semibold text-blue-900">Verification In Progress</p>
            <p className="text-sm text-blue-800 mt-1">
              Your company registration is currently under review by our admin team. You will receive a notification once the verification is complete.
            </p>
          </div>
        )}

        {company.registration_status === "REJECTED" && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm font-semibold text-red-900">Verification Rejected</p>
            <p className="text-sm text-red-800 mt-1">
              Your company verification was not approved. Please upload new evidence documents in the Documents tab to re-apply for verification.
            </p>
          </div>
        )}

        {company.registration_status === "APPROVED" && (
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm font-semibold text-green-900">Company Verified</p>
            <p className="text-sm text-green-800 mt-1">
              Your company has been successfully verified. You can now post jobs and manage applications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
