import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="flex flex-col w-full">

        {/* Header */}
        <div>
          {/* Hero Section */}
            <div className="flex flex-row justify-center items-start w-full min-h-[500px] px-0 py-[90px] bg-gradient-to-b from-[#ffffff26] via-[#f2fdfa26] to-[#e6fcf526] rounded-[40px] shadow-[0px_4px_4px_#0000003f] bg-cover bg-center bg-no-repeat max-w-[1440px] mx-auto" style={{ backgroundImage: "url('/assets/images/Kasetsart_Uni_View.png')"}}>
              <div className="flex flex-row justify-center items-center w-[94%]">
                {/* Hero Text */}
                <div className="flex flex-col gap-[24px] justify-start items-start flex-1 mb-[60px] ml-[24px]">
                  <h1 className="text-[27px] sm:text-[40px] md:text-[54px] font-poppins font-bold leading-[40px] sm:leading-[60px] md:leading-[81px] text-left bg-gradient-to-b from-[#2ba07c] to-[#0f3a2d] bg-clip-text text-transparent w-[60%]">
                    Start Your Journey with
                  </h1>
                  <h1 className="text-[27px] sm:text-[40px] md:text-[54px] font-poppins font-bold leading-[40px] sm:leading-[60px] md:leading-[81px] text-left bg-gradient-to-b from-[#2ba07c] to-[#0f3a2d] bg-clip-text text-transparent w-auto">
                    CPSK Job Connect
                  </h1>
                </div>
                {/* Hero Image */}
                <div className="w-[44%]">
                  <Image
                    src="/assets/images/people_connect_illustration.png"
                    alt="Online Connection Illustration"
                    width={518}
                    height={390}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
        </div>
        <div className="text-center">
          <p className="h2 text-gray-600 m-8">
            Choose your role to join our platform
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Company Card */}
          <Card className="group hover:shadow-xl hover:scale-101 transition-all duration-300 ease-in-out cursor-pointer hover:bg-orange-100">
            <CardContent className="p-8 text-center">
              <div>
                <Image
                  src="/assets/images/company_home.svg"
                  alt="Online Connection Illustration"
                  width={100}                  height={100}
                  className="w-full h-auto mb-6"                />
              </div>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                <Building className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="h2 text-gray-900 mb-4">Company</h2>
              <p className="body-1 text-gray-600 mb-6">
                Connect with talented students and find the perfect candidates for your team
              </p>
              <div className="space-y-3">
                <Link href="/login/company" className="block">
                  <Button className="w-full button bg-orange-600 hover:bg-orange-700">
                    Company Login
                  </Button>
                </Link>
                <Link href="/register/company" className="block">
                  <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-69 button">
                    Create Company Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card className="group hover:shadow-xl hover:scale-101 transition-all duration-300 ease-in-out cursor-pointer hover:bg-green-100">
            <CardContent className="p-8 text-center">
              <div>
                <Image
                  src="/assets/images/student_home.svg"
                  alt="Online Connection Illustration"
                  width={100}                  height={100}
                  className="w-full h-auto mb-6"                />
              </div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <GraduationCap className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="h2 text-gray-900 mb-4">Student</h2>
              <p className="text-gray-600 body-1 mb-6">
                Find internships and job opportunities that match your skills and interests
              </p>
              <div className="space-y-3">
                <Link href="/login/student" className="block">
                  <Button className="button w-full bg-green-600 hover:bg-green-700">
                    Student Login
                  </Button>
                </Link>
                <Link href="/register/student" className="block">
                  <Button variant="outline" className="button w-full border-green-200 text-green-700 hover:bg-green-50">
                    Create Student Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Illustration
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center w-64 h-32 bg-white rounded-lg shadow-sm">
            <div className="text-4xl">🔍</div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
