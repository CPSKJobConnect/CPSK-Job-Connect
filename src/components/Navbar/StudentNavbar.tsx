"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function StudentNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            <div className="relative" ref={dropdownRef}>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-white cursor-pointer bg-gray-300 flex items-center justify-center hover:border-gray-200 hover:scale-105 transition-all duration-200 shadow-md"
                >
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

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {session?.user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-600 truncate mt-0.5">
                                {session?.user?.email || ""}
                            </p>
                        </div>
                        <div className="py-1">
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-150 group"
                            >
                                <svg
                                    className="w-4 h-4 mr-3 text-gray-500 group-hover:text-red-600 transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                <span className="font-medium group-hover:text-red-700">Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </nav>
    );
}
