"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudentNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <nav
            className="flex items-center justify-between text-white h-16"
            style={{
                backgroundColor: "#006C67",
            }}
        >
        <Link href="/jobs" className="flex items-center">
            <Image
            src={"/assets/icons/logo.png"}
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
            <Link href="/student/my-application"
            className={`px-3 py-2 rounded-md transition-colors font-semibold ${
                pathname === "/student/my-application"
                  ? "bg-white/20 text-white"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}>
            My Applications
            </Link>
            <Link href="/student/profile"
            className={`px-3 py-2 rounded-md transition-colors font-semibold ${
                pathname === "/student/profile"
                  ? "bg-white/20 text-white"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}>
            Profile
            </Link>

            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white cursor-pointer bg-gray-300 flex items-center justify-center">
            {session?.user?.logoUrl ? (
                <Image
                    src={session.user.logoUrl || session.user.image || ""}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover"
                />
            ) : (
                <span className="text-gray-600 font-semibold text-sm">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
            )}
            </div>
        </div>
        </nav>
    );
}
