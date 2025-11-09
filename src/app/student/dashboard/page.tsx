"use client";

import { useSession } from "next-auth/react";
import { MdFilePresent } from "react-icons/md";
import { AiOutlineSchedule } from "react-icons/ai";
import { LiaFontAwesomeFlag } from "react-icons/lia";
import { RiSaveLine } from "react-icons/ri";
import StatCard from "@/components/StatCard";
import { useEffect, useState } from "react";
import { IconType } from "react-icons/lib";
import ApplicantBarChart from "./ApplicantLineChart";
import StatusPieChart from "./StatusPieChart";
import CategoryBarChart from "./CategoryBarChart";
import InterviewConversionCard from "./InterviewConversionCard";

const statIconMap: Record<string, { icon: IconType; iconBg: string; iconColor: string; key: string }> = {
  "Applications Sent": { icon: MdFilePresent, iconBg: "#FFE0CD", iconColor: "#FD873E", key: "applicationsSent" },
  "Interviews Scheduled": { icon: AiOutlineSchedule, iconBg: "#D0F4FF", iconColor: "#1E90FF", key: "interviewsScheduled" },
  "Offers Received": { icon: LiaFontAwesomeFlag, iconBg: "#D9F0E8", iconColor: "#10B981", key: "offersReceived" },
  "Saved Jobs": { icon: RiSaveLine, iconBg: "#F0D9FF", iconColor: "#A855F7", key: "savedJobs" },
};

const StudentDashboardPage = () => {
  const { data: session, status } = useSession();
  const [studentStat, setStudentStat] = useState<{ title: string; value: number; icon: IconType; iconBg: string; iconColor: string }[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/students/${session.user.id}/statistics/summary`);
        const json = await res.json();

        const stats = Object.entries(statIconMap).map(([title, data]) => ({
          title,
          value: json[data.key] ?? 0,
          icon: data.icon,
          iconBg: data.iconBg,
          iconColor: data.iconColor,
        }));

        setStudentStat(stats);
      } catch (err) {
        console.error("Error fetching student summary:", err);
      }
    };

    fetchStats();
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {studentStat.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value.toString()}
            icon={stat.icon}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
          />
        ))}
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-5">
          <ApplicantBarChart />
          <StatusPieChart />
        </div>
        <InterviewConversionCard />
        <div className="flex flex-col lg:flex-row gap-5 h-full">
          <CategoryBarChart />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
