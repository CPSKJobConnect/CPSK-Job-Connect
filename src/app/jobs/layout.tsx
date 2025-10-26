"use client";

import { Navbar01NavLink } from "@/components/ui/shadcn-io/navbar-01";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import UniversalNavbar from "@/components/Navbar/UniversalNavbar";

type Props = { children: React.ReactNode };

export default function JobsLayout({ children }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Base links
  const baseLinks: Navbar01NavLink[] = [
    { href: '/jobs', label: 'Browse Jobs', active: pathname === '/jobs' },
  ];

  // Role-specific links
  const roleLinks: Navbar01NavLink[] = [];
  if (session?.user?.role === 'student') {
    roleLinks.push({ href: '/student/dashboard', label: 'Dashboard', active: pathname === '/student/dashboard' });
    roleLinks.push({ href: '/student/my-application', label: 'My Applications', active: pathname === '/student/my-application' });
  } else if (session?.user?.role === 'company') {
    roleLinks.push({ href: '/company/job-applicant', label: 'Jobs & Applicants', active: pathname === '/company/job-applicant' });
  } else if (session?.user?.role === 'admin') {
    roleLinks.push({ href: '/admin/dashboard', label: 'Dashboard', active: pathname === '/admin/dashboard' });
  }

  const allLinks = [...baseLinks, ...roleLinks];

  const handleSignIn = () => {
    if (pathname !== "/") {
      router.push("/#role-selection");
    } else {
      const section = document.getElementById("role-selection");
      if (section) section.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="fixed top-0 left-0 w-full z-50">
        <UniversalNavbar
          links={allLinks}
          showBookmarks={true}
          onSignInClick={handleSignIn}
        />
      </div>
      <main className="flex-1 p-4 mt-16">{children}</main>
    </div>
  );
}
