"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function StudentNavbar() {
    const pathname = usePathname();
    const [profileUrl, setProfileUrl] = useState<string | null>(null);

    return (
        <nav className="flex items-center justify-between bg-[#006C67] text-white h-16">
        <Link href="/jobs" className="flex items-center">
            <Image
            src="/logo.png"
            alt="Logo"
            width={190}
            height={160}
            className="h-auto translate-y-1"
            />
        </Link>

        <div className="flex items-center gap-4 px-4">
            <Link href="/jobs" 
            className={`px-3 py-2 rounded-md transition-colors font-semibold ${
                pathname === "/jobs"
                  ? "bg-white/20 text-white"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}>
            Find Jobs
            </Link>
            <Link href="student/my-application" 
            className={`px-3 py-2 rounded-md transition-colors font-semibold ${
                pathname === "/my-application"
                  ? "bg-white/20 text-white"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}>
            My Applicants
            </Link>

            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white cursor-pointer">
            <Image
                src={profileUrl || "/default-profile.png"}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover"
            />
            </div>
        </div>
        </nav>
    );
}
