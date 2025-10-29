"use client";

import CompanyNavbar from "@/components/Navbar/CompanyNavbar";

type Props = {
  children: React.ReactNode;
};

export default function StudentLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50">
        <CompanyNavbar />
      </div>
      <main className="flex-1 p-4 mt-16">{children}</main>
    </div>
  );
}