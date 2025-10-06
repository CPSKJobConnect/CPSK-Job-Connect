"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Navbar01, Navbar01NavLink } from '@/components/ui/shadcn-io/navbar-01';
import { usePathname } from 'next/navigation';

export default function StudentNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links: Navbar01NavLink[] = [
    { href: '/jobs', label: 'Find Jobs', active: pathname === '/jobs' },
    { href: '/student/my-application', label: 'My Applications', active: pathname === '/student/my-application' },
  ];

  const rightSide = (
    <div className="flex items-center gap-4">
      {/* Navigation buttons */}
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md font-semibold transition-colors ${
            link.active ? "bg-white/20 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"
          }`}
        >
          {link.label}
        </a>
      ))}

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white cursor-pointer bg-gray-300 flex items-center justify-center">
        {session?.user?.logoUrl ? (
          <Image
            src={session.user.logoUrl}
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
  );

  return (
    <Navbar01 rightContent={rightSide} />
  );
}
