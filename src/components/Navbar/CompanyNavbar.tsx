"use client";


import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Navbar01, Navbar01NavLink } from '@/components/ui/shadcn-io/navbar-01';
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useRouter } from "next/navigation";
import { Building2, LogOut } from 'lucide-react';

export default function CompanyNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const links: Navbar01NavLink[] = [
    { href: '/company/dashboard', label: 'Dashboard', active: pathname === '/company/dashboard' },
    { href: '/company/job-posting', label: 'Job Posting', active: pathname === '/company/job-posting' },
    { href: '/company/applications', label: 'Applications', active: pathname === '/company/applications' },
  ];

  const rightContent = (
    <div className="flex items-center gap-4">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md font-semibold transition-colors ${link.active ? "bg-white/20 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"
            }`}
        >
          {link.label}
        </Link>
      ))}

      {session && (
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

          <PopoverContent className="w-56 p-2">
            <div className="flex flex-col space-y-1">
              {/* Profile Section */}
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Company Profile Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-normal"
                onClick={() => router.push('/company/profile')}
              >
                <Building2 className="h-4 w-4" />
                <span>Company Profile</span>
              </Button>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Sign Out Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-red-50 text-red-600 hover:text-red-700 font-normal"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  const loggedOutContent = (
    <div className="flex items-center gap-4">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md font-semibold transition-colors ${link.active ? "bg-white/20 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"
            }`}
        >
          {link.label}
        </Link>
      ))}
      <Button
        id="signin-btn"
        size="sm"
        className="text-sm font-medium px-4 h-9 rounded-md"
        onClick={(e) => {
          e.preventDefault();
          const section = document.getElementById("role-selection");
          if (section) section.scrollIntoView({ behavior: "smooth" });
          else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }}
      >
        Sign In
      </Button>
    </div>
  );

  return (
    <Navbar01 rightContent={session ? rightContent : loggedOutContent} />
  );
}
