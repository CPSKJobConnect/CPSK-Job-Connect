'use client';

import './navbar01.css';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import Link from "next/link"
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

// Types
export interface Navbar01NavLink {
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
              {/* Mobile menu trigger */}
              {isMobile && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                      variant="ghost"
                      size="icon"
                    >
                      <HamburgerIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-48 p-2">
                    <NavigationMenu className="max-w-none">
                      <NavigationMenuList className="flex-col items-start gap-1">
                        {navigationLinks.map((link, index) => (
                          <NavigationMenuItem key={index} className="w-full">
                            <button
                              onClick={(e) => e.preventDefault()}
                              className={cn(
                                "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer no-underline",
                                link.active ? "bg-accent text-accent-foreground" : "text-foreground/80"
                              )}
                            >
                              {link.label}
                            </button>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>
                  </PopoverContent>
                </Popover>
              )}

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
              {rightContent || (
                <Button
                  id="signin-btn"
                  size="sm"
                  className="text-sm font-medium px-4 h-9 rounded-md"
                  onClick={(e) => {
                    e.preventDefault();
                    const section = document.getElementById("role-selection");
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    } else {
                      // fallback if not found
                      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                    }
                  }}
                >
                  {signInText}
                </Button>
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