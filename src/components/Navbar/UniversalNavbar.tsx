"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Navbar01, Navbar01NavLink } from '@/components/ui/shadcn-io/navbar-01';
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { User, Building2, Shield, Bookmark, LogOut } from 'lucide-react';

interface UniversalNavbarProps {
  links: Navbar01NavLink[];
  showBookmarks?: boolean;
  onSignInClick?: () => void;
}

export default function UniversalNavbar({ links, showBookmarks = false, onSignInClick }: UniversalNavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const defaultSignInHandler = () => {
    const section = document.getElementById("role-selection");
    if (section) section.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const getProfileIcon = () => {
    switch (session?.user?.role) {
      case 'company':
        return <Building2 className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getProfileLabel = () => {
    switch (session?.user?.role) {
      case 'company':
        return 'Company Profile';
      case 'admin':
        return 'Admin Profile';
      default:
        return 'Profile';
    }
  };

  const handleProfileClick = () => {
    const role = session?.user?.role;
    if (!role) {
      router.push('/register/complete');
    } else {
      router.push(`/${role}/profile`);
    }
  };

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
                {session.user?.role === 'admin' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-600 uppercase">Admin</p>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>

              <div className="border-t border-gray-100 my-1"></div>

              {/* Profile Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-normal"
                onClick={handleProfileClick}
              >
                {getProfileIcon()}
                <span>{getProfileLabel()}</span>
              </Button>

              {/* Bookmarks Button (conditionally shown) */}
              {showBookmarks && session.user?.role === 'student' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-normal"
                  onClick={() => router.push('/student/bookmarks')}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Bookmarks</span>
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
          if (onSignInClick) {
            onSignInClick();
          } else {
            defaultSignInHandler();
          }
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
