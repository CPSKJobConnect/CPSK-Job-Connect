"use client";

import StudentNavbar from "@/components/Navbar/StudentNavbar";

type Props = {
  children: React.ReactNode;
};

export default function StudentLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2FFFB]">
      <div className="fixed top-0 left-0 w-full z-50">
        <StudentNavbar />
      </div>
      <main className="flex-1 p-4 mt-16">{children}</main>
    </div>
  );
}
