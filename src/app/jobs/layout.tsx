"use client";

import { Navbar01, Navbar01NavLink } from "@/components/ui/shadcn-io/navbar-01";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "next-auth/react";
import Link from "next/link";

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

  // Right content
  const rightContent = session ? (
    // Logged-in: links + avatar
    <div className="flex items-center gap-4">
      {allLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md font-semibold transition-colors ${
            link.active ? "bg-white/20 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"
            }`}
        >
          {link.label}
        </Link>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white cursor-pointer bg-gray-300 flex items-center justify-center"
          >
            {session.user?.logoUrl ? (
              <Image
                src={session.user.logoUrl}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <span className="text-gray-600 font-semibold text-sm">
                {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-50 text-center">
          <div className="flex flex-col gap-2">
            <Button
              variant="link"
              size="sm"
              className="w-full"
              onClick={() => {
                const role = session.user?.role;
                if (!role) {
                  router.push('/register/complete');
                } else {
                  router.push(`/${role}/profile`);
                }
              }}
            >
              <p className="text-sm font-medium">{session.user?.name}</p>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-red-500 hover:text-red-600"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ) : (
    // Logged-out: links + styled Sign In button
    <div className="flex items-center gap-4">
      {allLinks.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md font-semibold transition-colors ${link.active ? "bg-white/20 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"
            }`}
        >
          {link.label}
        </a>
      ))}

      <Button
        size="sm"
        className="bg-white text-black hover:bg-gray-100 px-4 h-9 rounded-md font-medium"
        onClick={() => {
          if (pathname !== "/") {
            router.push("/#role-selection"); // redirect to landing page with hash
          } else {
            const section = document.getElementById("role-selection");
            if (section) section.scrollIntoView({ behavior: "smooth" });
            else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }
        }}
      >
        Sign In
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar01 rightContent={rightContent} />
      </div>
      <main className="flex-1 p-4 mt-16">{children}</main>
    </div>
  );
}
