"use client"

import { useSession } from "next-auth/react"
import { MdWorkOutline, MdOutlineArchive } from "react-icons/md";
import { AiOutlineSchedule, AiOutlineClockCircle } from "react-icons/ai";
import { BsClipboardCheck, BsClipboardData } from "react-icons/bs";
import { RiDraftLine, RiUserSharedLine, RiUserHeartLine } from "react-icons/ri";
import { PiHandshakeLight } from "react-icons/pi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import StatCard from "@/components/StatCard";
import { mockCompanyStat, mockApplicationTrendData, mockStatusBreakdown, mockApplications, mockTopJobs} from "../../../../public/data/mockCompanyStat";
import ApplicationTrendChart from "./ApplicationTrendChart";
import StatusBreakdownChart from "./StatusBreakdownChart";
import RecentApplicationsTable from "./RecentApplicationsTable";
import TopJobCard from "./TopJobsCard";
import { useEffect, useState } from "react";
import { IconType } from "react-icons/lib";


const companyStatsConfig: Record<string, { icon: IconType; iconBg: string; iconColor: string; key: string }> = {
  "Total Jobs": {
    icon: MdWorkOutline,
    iconBg: "#FFEFEA",
    iconColor: "#FD8A5E",
    key: "totalJobs",
  },
  "Active Jobs": {
    icon: AiOutlineSchedule,
    iconBg: "#E6F6FF",
    iconColor: "#2E93FF",
    key: "activeJobs",
  },
  "Draft Jobs": {
    icon: RiDraftLine,
    iconBg: "#E9F8F0",
    iconColor: "#34C38F",
    key: "draftJobs",
  },
  "Closed Jobs": {
    icon: MdOutlineArchive,
    iconBg: "#F4E9FF",
    iconColor: "#A855F7",
    key: "closedJobs",
  },
  "Total Applications": {
    icon: HiOutlineUserGroup,
    iconBg: "#FFF3E6",
    iconColor: "#F59E0B",
    key: "totalApplications",
  },
  "New Applications": {
    icon: BsClipboardData,
    iconBg: "#E8F5FF",
    iconColor: "#3B82F6",
    key: "newApplications",
  },
  "Pending Applications": {
    icon: AiOutlineClockCircle,
    iconBg: "#FFF7E6",
    iconColor: "#FBBF24",
    key: "pendingApplications",
  },
  "Reviewed Applications": {
    icon: BsClipboardCheck,
    iconBg: "#E7F9EE",
    iconColor: "#10B981",
    key: "reviewedApplications",
  },
  "Interviews Scheduled": {
    icon: PiHandshakeLight,
    iconBg: "#E8E8FF",
    iconColor: "#6366F1",
    key: "interviewsScheduled",
  },
  "Offers Rejected": {
    icon: RiUserSharedLine,
    iconBg: "#FFF0F4",
    iconColor: "#EC4899",
    key: "offersRejected",
  },
  "Offers Accepted": {
    icon: RiUserHeartLine,
    iconBg: "#E7FAF5",
    iconColor: "#14B8A6",
    key: "offersAccepted",
  },
};


const CompanyDashboardPage = () => {
  const { data: session, status } = useSession()
  const [companyStat, setCompanyStat] = useState<{ title: string; value: number; icon: IconType; iconBg: string; iconColor: string }[]>([]);

  useEffect(() => {
    const stats = Object.entries(companyStatsConfig).map(([title, data]) => ({
      title,
      value: mockCompanyStat[data.key as keyof typeof mockCompanyStat],
      icon: data.icon,
      iconBg: data.iconBg,
      iconColor: data.iconColor,
    }));

    setCompanyStat(stats);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {companyStat.map((stat, idx) => {
          const iconData = companyStatsConfig[stat.title];
          return (
            <StatCard
              key={idx}
              title={stat.title}
              value={stat.value.toString()}
              icon={iconData.icon}
              iconBg={iconData.iconBg}
              iconColor={iconData.iconColor}
            />
          );
        })}
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-5">
          <ApplicationTrendChart data={mockApplicationTrendData} loading={false} />
          <StatusBreakdownChart data={mockStatusBreakdown} loading={false} />
        </div>

        <div className="flex flex-col lg:flex-row gap-5 h-full items-stretch">
          <div className="basis-3/5 h-full min-h-0">
            <RecentApplicationsTable applications={mockApplications} loading={false} />
          </div>
          <div className="basis-2/5 h-full min-h-0">
            <TopJobCard jobs={mockTopJobs} loading={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyDashboardPage