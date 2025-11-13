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
import { VerificationBanner } from "@/components/VerificationBanner";

const statIconMap: Record<string, { icon: IconType; iconBg: string; iconColor: string; key: string }> = {
  "Applications Sent": { icon: MdFilePresent, iconBg: "#FFE0CD", iconColor: "#FD873E", key: "applicationsSent" },
  "Interviews Scheduled": { icon: AiOutlineSchedule, iconBg: "#D0F4FF", iconColor: "#1E90FF", key: "interviewsScheduled" },
  "Offers Received": { icon: LiaFontAwesomeFlag, iconBg: "#D9F0E8", iconColor: "#10B981", key: "offersReceived" },
  "Saved Jobs": { icon: RiSaveLine, iconBg: "#F0D9FF", iconColor: "#A855F7", key: "savedJobs" },
};

const StudentDashboardPage = () => {
  const { data: session, status, update } = useSession()
  const [studentStat, setStudentStat] = useState<{ title: string; value: number; icon: IconType; iconBg: string; iconColor: string }[]>([]);
  const [verificationNotes, setVerificationNotes] = useState<string | null>(null);

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

  // Check for verification status updates
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/students/verification-status');
        if (response.ok) {
          const data = await response.json();

          // Store verification notes for display in banner
          setVerificationNotes(data.verificationNotes);

          // If verification status changed, update the session
          if (data.verificationStatus !== session.user.verificationStatus) {
            await update({
              ...session,
              user: {
                ...session.user,
                verificationStatus: data.verificationStatus,
              }
            });
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check on mount
    checkVerificationStatus();

    // Check every 30 seconds
    const interval = setInterval(checkVerificationStatus, 30000);

    return () => clearInterval(interval);
  }, [session, update]);

  // Let the global loader handle initial loading (session + child components)
  if (status === "loading") {
    return null;
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
      {/* Verification Banner */}
      {session.user.emailVerified !== undefined &&
       session.user.studentStatus &&
       session.user.verificationStatus && (
        <VerificationBanner
          emailVerified={session.user.emailVerified}
          studentStatus={session.user.studentStatus}
          verificationStatus={session.user.verificationStatus}
          email={session.user.email || ""}
          rejectionReason={verificationNotes}
        />
      )}

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
