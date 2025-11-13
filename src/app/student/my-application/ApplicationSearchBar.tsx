"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react";
import { IoMdSearch } from "react-icons/io";
import { FiChevronDown } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";
import { Button } from "@/components/ui/button";


interface ApplicationSearchBarProps {
  applications: any[];
  setFilteredApplications: (apps: any[]) => void;
}

const ApplicationSearchBar = ({ applications, setFilteredApplications }: ApplicationSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const status: string[] = ["all", "pending", "reviewed", "interview", "offered", "rejected"];
  
  useEffect(() => {
    try {
      const q = String(query || "").trim().toLowerCase();

      const filtered = applications.filter((a) => {
        const appStatus = String(a?.status || "").toLowerCase();
        const statusMatch = selectedStatus === "all" || appStatus === selectedStatus;

        if (!q) return statusMatch;

        const jobName = String(a?.job?.jobName || "").toLowerCase();
        const companyName = String(a?.job?.company?.name || "").toLowerCase();

        const queryMatch = jobName.includes(q) || companyName.includes(q);

        return statusMatch && queryMatch;
      });

      setFilteredApplications(filtered);
    } catch (err) {
      console.error("Error filtering applications:", err);
    }
  }, [applications, query, selectedStatus, setFilteredApplications]);
  
  return (
    <div className="mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-6 border border-gray-100 rounded-lg px-7 py-4 mb-6 w-full shadow-md relative">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#34BFA3] rounded-l-md" />
          <div className="pl-4 w-full">
            <div className="flex items-center gap-4 w-full">
              <div className="relative flex-1">
                <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jobs or companies"
                  className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full h-10"
                />
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="hidden sm:block">
                 <div className="md:w-[180px] w-full flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button className="group bg-white border border-gray-200 md:w-[180px] text-gray-800 font-semibold rounded-full px-4 flex items-center justify-between gap-2 transition-colors hover:bg-[#34BFA3] hover:text-white focus:outline-none focus:ring-0">
                            <span className="flex items-center gap-2">
                              <span className="hidden sm:inline">{selectedStatus === 'all' ? 'All Statuses' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}</span>
                            </span>
                            <FiChevronDown className="w-4 h-4 text-gray-600 group-hover:text-white" />
                        </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-56 p-2">
                        <div className="px-2 py-1 text-xs text-gray-500">Filter by status</div>
                        <DropdownMenuRadioGroup value={selectedStatus} onValueChange={(value) => {setSelectedStatus(value)}}>
                          {status.map((s) => (
                            <DropdownMenuRadioItem
                              key={s}
                              value={s}
                              className={`flex items-center justify-between pl-8 pr-3 py-2 rounded-md text-sm ${
                                selectedStatus === s ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="capitalize">{s === 'all' ? 'All' : s}</span>
                              {selectedStatus === s && <IoMdCheckmark className="w-4 h-4 text-green-600" />}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
}
export default ApplicationSearchBar;