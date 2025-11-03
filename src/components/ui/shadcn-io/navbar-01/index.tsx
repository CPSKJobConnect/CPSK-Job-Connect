'use client';

import './navbar01.css';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link"
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  MantineProvider
} from '@mantine/core';

// Simple logo component for the navbar
const Logo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <img
      src="/assets/icons/logo.png" // same logo as StudentNavbar
      alt="Logo"
      className={cn("block h-30 mt-1 w-auto", className)}
      {...props}
    />
  );
};

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
    />
  </svg>
);

// Types for left side
export interface Navbar01NavLink {
  href: string;
  label: string;
  active?: boolean;
}

// Types 2 for right side
export interface Navbar01NavLink2 {
  href: string;
  label: string;
  active?: boolean;
}

// Default navigation links
const defaultNavigationLinks: Navbar01NavLink[] = [
  { href: 'https://github.com/CPSKJobConnect/CPSK-Job-Connect/wiki', label: 'About' },
];

export interface Navbar01Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar01NavLink[];
  rightContent?: React.ReactNode; // NEW: custom right content like avatar/buttons
  signInText?: string;
  signInHref?: string;
  ctaText?: string;
  ctaHref?: string;
  onSignInClick?: () => void;
  onCtaClick?: () => void;
}

export const Navbar01 = React.forwardRef<HTMLElement, Navbar01Props>(
  (
    {
      className,
      logo = <Logo />,
      logoHref = '#',
      navigationLinks = defaultNavigationLinks,
      rightContent, // destructure so it doesn't go to header
      signInText = 'Sign In',
      signInHref = '#signin',
      ctaText = 'Get Started',
      ctaHref = '#get-started',
      onSignInClick,
      onCtaClick,
      ...props // only native props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768);
        }
      };
      checkWidth();
      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const pathname = usePathname();
    const { data: session } = useSession();
    const router = useRouter();

    // const RightSideLinks: Navbar01NavLink2[] = [
    //   { href: '/jobs', label: 'Browse Jobs', active: pathname === '/jobs' },
    // ];

    return (
      <MantineProvider>
        <header
          ref={combinedRef}
          className={cn(
            'fixed top-0 z-50 w-full border-b bg-[#006C67] backdrop-blur supports-[backdrop-filter]:bg-[#006C67]/95 px-4 md:px-6 [&_*]:no-underline',
            className
          )}
          {...props} // safe now, rightContent is not included
        >
          <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex items-center">
              {/* Mobile: don't render any navigation on the left - we show a single hamburger on the right */}

              {/* Main nav */}

              {/* Logo */}
              <div className="flex items-center">
                <button
                  onClick={(e) => e.preventDefault()}
                  aria-label="Home"
                  className="inline-flex items-center justify-center p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {logo}
                </button>

                {/* Left side */}
                {!isMobile && (
                  <NavigationMenu className="flex">
                    <NavigationMenuList className="gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index}>
                          <NavigationMenuLink
                            asChild
                            className={cn(`px-3 py-2 rounded-md font-semibold transition-colors ${
                              link.active ? "bg-white/20 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"}`)}
                          >
                            {link.href.startsWith("http") ? (
                              <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                            ) : (
                              <Link href={link.href}>{link.label}</Link>
                            )}
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isMobile ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                      variant="ghost"
                      size="icon"
                      aria-label="Open menu"
                    >
                      <HamburgerIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-2">
                    <div className="flex flex-col gap-2">
                      {/* Use a plain vertical list for mobile to avoid upstream NavigationMenu layout overrides */}
                      <div className="flex flex-col items-start gap-1">
                        {navigationLinks.map((link, index) => (
                          <div key={index} className="w-full">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (link.href.startsWith('http')) window.open(link.href, '_blank');
                                else router.push(link.href);
                              }}
                              className={cn(
                                "w-full text-left rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                link.active ? "bg-accent text-accent-foreground" : "text-black hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              {link.label}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t" />

                      {/* Render action items (Profile / Bookmarks / Sign out) as individual mobile menu entries
                          instead of dumping the entire rightContent node which may render horizontally. */}
                      <div className="flex flex-col gap-2 pt-2">
                        {session ? (
                          <>
                            <button
                              onClick={() => router.push(`/${session.user?.role || 'student'}/profile`)}
                              className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                            >
                              Profile
                            </button>

                            <button
                              onClick={() => router.push('/jobs')}
                              className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                            >
                              Browse Jobs
                            </button>

                            <button
                              onClick={() => router.push(`/${session.user?.role || 'student'}/dashboard`)}
                              className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                            >
                              Dashboard
                            </button>

                            {session.user?.role === 'company' && (
                              <button
                                onClick={() => router.push('/company/job-posting')}
                                className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                              >
                                Job Posting
                              </button>
                            )}

                            {session.user?.role === 'company' && (
                              <button
                                onClick={() => router.push('/company/job-applicant')}
                                className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                              >
                                Job Applicant
                              </button>
                            )}

                            {session.user?.role === 'student' && (
                              <button
                                onClick={() => router.push('/student/bookmark')}
                                className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                              >
                                Bookmark
                              </button>
                            )}

                            {session.user?.role === 'student' && (
                              <button
                                onClick={() => router.push('/student/my-application')}
                                className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                              >
                                My Applications
                              </button>
                            )}

                            <button
                              onClick={() => signOut({ callbackUrl: '/' })}
                              className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-red-50 hover:text-red-600"
                            >
                              Sign out
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const section = document.getElementById('role-selection');
                              if (section) section.scrollIntoView({ behavior: 'smooth' });
                              else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            }}
                            className="w-full text-left rounded-md px-3 py-3 text-sm font-medium text-black hover:bg-accent hover:text-accent-foreground"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                // Desktop/tablet: show rightContent as-is (avatar, buttons, etc.)
                (rightContent ? rightContent : session ? (
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
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-500 hover:text-red-600"
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Sign out
                      </Button>
                    </PopoverContent>
                  </Popover>
                ) : (
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
                ))
              )}
            </div>

          </div>
        </header>
      </MantineProvider>
    );
  }
);

Navbar01.displayName = 'Navbar01';


export { Logo, HamburgerIcon };