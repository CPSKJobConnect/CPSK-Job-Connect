'use client';

import './navbar01.css';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  MantineProvider
} from '@mantine/core';

const Logo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <img
      src="/assets/icons/logo.png"
      alt="Logo"
      className={cn("block h-8 md:h-10 w-auto object-contain", className)}
      {...props}
    />
  );
};


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


export interface Navbar01NavLink {
  href: string;
  label: string;
  active?: boolean;
}


export interface Navbar01NavLink2 {
  href: string;
  label: string;
  active?: boolean;
}


export interface Navbar01Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar01NavLink[];
  rightContent?: React.ReactNode;
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
      rightContent,
      signInText = 'Sign In',
      signInHref = '#signin',
      ctaText = 'Get Started',
      ctaHref = '#get-started',
      onSignInClick,
      onCtaClick,
      ...props
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
    const isActive = (href: string) => {
      if (!pathname) return false;
      return pathname === href || pathname.startsWith(href + "/");
    };


    return (
      <MantineProvider>
        <header
          ref={combinedRef}
          className={cn(
            'fixed top-0 z-50 w-full border-b bg-[#006C67] backdrop-blur supports-[backdrop-filter]:bg-[#006C67]/95 px-4 md:px-6 [&_*]:no-underline',
            className
          )}
          {...props}
        >
          <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => e.preventDefault()}
                  aria-label="Home"
                  className="inline-flex items-center justify-center p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 hover:scale-105 transition-transform"
                >
                  {logo}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isMobile ? (
                <Popover>
                  <PopoverTrigger asChild>
                      <Button
                        className="group h-10 w-10 bg-white/10 text-white hover:bg-white/20 rounded-lg shadow-sm"
                        variant="ghost"
                        size="icon"
                        aria-label="Open menu"
                      >
                        <HamburgerIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-3 bg-white rounded-lg shadow-lg ring-1 ring-black/5">
                      <div className="flex flex-col gap-3">
                      <div className="flex flex-col items-start gap-1">
                      </div>

                      <div className="flex flex-col gap-2 pt-2 divide-y divide-gray-100">
                        {session ? (
                          <>
                            <button
                              onClick={() => router.push(`/${session.user?.role || 'student'}/profile`)}
                              className={cn(
                                "w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition",
                                isActive(`/${session.user?.role || 'student'}/profile`) ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-gray-700 hover:bg-gray-50'
                              )}
                            >
                              <span className="font-medium">Profile</span>
                            </button>

                            <button
                              onClick={() => router.push('/jobs')}
                              className={cn(
                                "w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition",
                                isActive('/jobs') ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-gray-700 hover:bg-gray-50'
                              )}
                            >
                              Browse Jobs
                            </button>

                            <button
                              onClick={() => router.push(`/${session.user?.role || 'student'}/dashboard`)}
                              className={cn(
                                "w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition",
                                isActive(`/${session.user?.role || 'student'}/dashboard`) ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-gray-700 hover:bg-gray-50'
                              )}
                            >
                              Dashboard
                            </button>

                            {session.user?.role === 'company' && (
                                <button
                                  onClick={() => router.push('/company/job-posting')}
                                  className={cn(
                                    "w-full text-left px-3 py-3 text-sm font-medium rounded-md transition",
                                    isActive('/company/job-posting') ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-black hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  Job Posting
                                </button>
                            )}

                            {session.user?.role === 'company' && (
                                <button
                                  onClick={() => router.push('/company/job-applicant')}
                                  className={cn(
                                    "w-full text-left px-3 py-3 text-sm font-medium rounded-md transition",
                                    isActive('/company/job-applicant') ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-black hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  Job Applicant
                                </button>
                            )}

                            {session.user?.role === 'student' && (
                                <button
                                  onClick={() => router.push('/student/bookmark')}
                                  className={cn(
                                    "w-full text-left px-3 py-3 text-sm font-medium rounded-md transition",
                                    isActive('/student/bookmark') ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-black hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  Bookmark
                                </button>
                            )}

                            {session.user?.role === 'student' && (
                                <button
                                  onClick={() => router.push('/student/my-application')}
                                  className={cn(
                                    "w-full text-left px-3 py-3 text-sm font-medium rounded-md transition",
                                    isActive('/student/my-application') ? 'bg-[#F3FEFA] text-[#2BA17C]' : 'text-black hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  My Applications
                                </button>
                            )}

                            <button
                              onClick={() => signOut({ callbackUrl: '/' })}
                              className="w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition"
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
                            className="w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                (rightContent ? rightContent : session ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                       role="button"
                       tabIndex={0}
                       aria-haspopup="menu"
                       data-testid="profile-avatar"
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
                    <PopoverContent className="w-50 text-center p-3">
                      <div className="flex flex-col divide-y divide-gray-200">
                        <div className="py-2">
                          <p className="text-sm font-medium">{session.user?.name}</p>
                        </div>
                        <div className="py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-red-500 hover:text-red-600"
                            onClick={() => signOut({ callbackUrl: "/" })}
                          >
                            Sign out
                          </Button>
                        </div>
                      </div>
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