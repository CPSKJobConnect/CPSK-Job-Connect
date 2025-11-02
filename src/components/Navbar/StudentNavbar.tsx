"use client";

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Navbar01, Navbar01NavLink } from '@/components/ui/shadcn-io/navbar-01';
import { Bookmark, LogOut, User } from 'lucide-react';
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';

export default function StudentNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const links: Navbar01NavLink[] = [
    { href: '/jobs', label: 'Browse Jobs', active: pathname === '/jobs' },
    { href: '/student/dashboard', label: 'Dashboard', active: pathname === '/student/dashboard' },
    { href: '/student/my-application', label: 'My Applications', active: pathname === '/student/my-application' },
  ];

  // Right side content for Navbar01
  const rightContent = (
    <div className="flex items-center gap-4">
      {/* Navigation links */}
      {links.map(link => (
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

      {/* Avatar if logged in */}
      {session && (
        <Popover>
          <PopoverTrigger asChild>
            <div 
              role="button"
              data-testid="profile-menu-popover"
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

              {/* Profile Button */}
              <Button
                data-testid="profile-menu-profile-btn"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-normal"
                onClick={() => router.push('/student/profile')}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Button>

              {/* Bookmark for Student Button */}
              {session.user?.role === 'student' && (
                <Button
                  data-testid="profile-menu-bookmark-btn"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-normal"
                  onClick={() => router.push('/student/bookmark')}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Bookmark</span>
                </Button>
              )}

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

  // If logged out, we still need links + Sign In button
  const loggedOutContent = (
    <div className="flex items-center gap-4">
      {links.map(link => (
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
