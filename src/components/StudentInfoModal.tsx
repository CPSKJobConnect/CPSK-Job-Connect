"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LuPhone } from "react-icons/lu";
import { MdOutlineMailOutline, MdOutlinePersonOutline } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { toast } from "sonner";

interface ApplicantInfo {
  applicant_id: string;
  profile_url: string;
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string;
  faculty?: string;
  year?: string;
  student_id?: string;
  documents: {
    resume_url: string | null;
    resume_name?: string | null;
    portfolio_url: string | null;
    portfolio_name?: string | null;
  };
  applied_position: string;
  applied_at: Date | string;
  work_experience: {
    position: string;
    company: string;
    period: string;
    responsibility: string;
  }[];
  certification: string[];
}

const StudentInfoModal = ({ applicant_id, size }: { applicant_id: string; size?: string }) => {
  const [applicantInfo, setApplicantInfo] = useState<ApplicantInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!applicant_id) return;

    const fetchApplicantInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/company/applicants/${applicant_id}`);

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to fetch applicant info:", error);
          toast.error("Failed to load applicant profile", {
            description: error.error || "Unable to fetch applicant data"
          });
          return;
        }

        const result = await response.json();
        if (result.success) {
          setApplicantInfo(result.data);
        }
      } catch (error) {
        console.error("Error fetching applicant info:", error);
        toast.error("Error loading profile", {
          description: "An unexpected error occurred"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplicantInfo();
  }, [applicant_id]);

  const baseStyle = "flex flex-row gap-1 bg-[#FD873E] text-white rounded-xl shadow-md hover:bg-[#FF9A50] hover:shadow-lg";

    const sizeStyle = {
      sm: "p-2 text-sm h-[30px] w-[80px]",
    }[size || ""];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={`${baseStyle} ${sizeStyle}`}>
          <MdOutlinePersonOutline size={20} />
          <p>Profile</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="md:min-w-[700px] sm:min-w-[400px] h-[500px] overflow-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {applicantInfo ? `${applicantInfo.firstname} ${applicantInfo.lastname} Profile` : "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-gray-500">Loading applicant info...</p>
        ) : applicantInfo ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-row gap-6">
              <div className="flex-shrink-0">
                {applicantInfo.profile_url ? (
                  <Image
                    src={applicantInfo.profile_url}
                    alt="applicantProfile"
                    width={70}
                    height={70}
                    className="rounded-lg shadow-md object-cover"
                  />
                ) : (
                  <div className="w-[70px] h-[70px] bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-2xl font-semibold text-gray-700">
                    {applicantInfo.firstname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between gap-3 flex-1">
                <div className="flex flex-row gap-2 items-center">
                  <p className="text-xl font-semibold">{applicantInfo.firstname}</p>
                  <p className="text-xl font-semibold">{applicantInfo.lastname}</p>
                </div>

                <div className="flex flex-row gap-6 text-gray-600">
                  <div className="flex flex-row items-center gap-2">
                    <MdOutlineMailOutline />
                    <p className="text-sm">{applicantInfo.email}</p>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <LuPhone />
                    <p className="text-sm">{applicantInfo.phone_number}</p>
                  </div>
                </div>

                {(applicantInfo.faculty || applicantInfo.year) && (
                  <div className="flex flex-row gap-6 text-gray-600 text-sm">
                    {applicantInfo.faculty && <p>Faculty: {applicantInfo.faculty}</p>}
                    {applicantInfo.year && <p>Year: {applicantInfo.year}</p>}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <p className="text-md font-bold text-gray-800">Application Information</p>
              <div className="flex flex-row gap-10">
                <div className="flex flex-col gap-1">
                  <p className="text-gray-500 text-sm">Position</p>
                  <p className="font-medium">{applicantInfo.applied_position}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-gray-500 text-sm">Application Date</p>
                  <p className="font-medium">{new Date(applicantInfo.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>

            {applicantInfo.work_experience.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <p className="text-md font-bold text-gray-800">Work Experience</p>
                  {applicantInfo.work_experience.map((exp, index) => (
                    <div key={index} className="border p-3 rounded-md shadow-sm bg-gray-50">
                      <p className="font-medium">{exp.position} at {exp.company}</p>
                      <p className="text-sm text-gray-500">{exp.period}</p>
                      <p className="text-sm">{exp.responsibility}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {applicantInfo.certification.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <p className="text-md font-bold text-gray-800">Certifications</p>
                  <ul className="list-disc list-inside">
                    {applicantInfo.certification.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div className="flex flex-col gap-2">
              <p className="text-md font-bold text-gray-800">Documents</p>
              <div className="flex flex-row gap-6">
                {applicantInfo.documents.resume_url ? (
                  <a href={applicantInfo.documents.resume_url} target="_blank" rel="noopener noreferrer">
                    <div className="flex flex-row gap-1 bg-[#2BA17C] text-white rounded-md shadow-md p-2 text-sm hover:bg-[#27946F]">
                      <RiExternalLinkLine className="w-5 h-5 mt-1"/>
                      <p>Resume</p>
                    </div>
                  </a>
                ) : (
                  <div className="text-sm text-gray-500">No resume uploaded</div>
                )}
                {applicantInfo.documents.portfolio_url ? (
                  <a href={applicantInfo.documents.portfolio_url} target="_blank" rel="noopener noreferrer">
                    <div className="flex flex-row gap-1 bg-[#2BA17C] text-white rounded-md shadow-md p-2 text-sm hover:bg-[#27946F]">
                      <RiExternalLinkLine className="w-5 h-5 mt-1"/>
                      <p>Portfolio</p>
                    </div>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">No applicant information available</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentInfoModal;
