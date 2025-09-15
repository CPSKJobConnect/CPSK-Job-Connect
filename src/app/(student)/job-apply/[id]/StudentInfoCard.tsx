"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { MdOutlinePerson } from "react-icons/md";
import { MdOutlineMail } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { Button } from "@/components/ui/button";


interface StudentInfoProps {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    faculty: string;
}


const StudentInfoCard = (props: StudentInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: props.firstname || "",
    lastname: props.lastname || "",
    email: props.email || "",
    phone: props.phone || "",
    faculty: props.faculty || "",
  });

  const toggleEdit = () => {
    if (!isEditing) {
        // save form
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (field: string, value: string) => {
    if (field === "phone") {
        if (/^\d*$/.test(value) && value.length <= 10) {
            setFormData({ ...formData, [field]: value});
        }
        return;
    }
    setFormData({ ...formData, [field]: value });
  };
  
  return (
    <div className="flex flex-col rounded-md shadow-md border border-gray-100 w-full h-full">
        <div className="flex flex-row justify-between items-center p-3">
            <div className="flex flex-row gap-2">
                <MdOutlinePerson className="w-7 h-7" />
                <p className="text-lg font-semibold text-gray-800">Personal Information</p>
            </div>
            <div className="flex justify-end">
                <Button 
                className="text-white bg-[#34BFA3] hover:bg-[#2DA68C] rounded-md shadow-md font-semibold text-xs py-0.5 px-3"
                onClick={toggleEdit}
                >
                {isEditing ? "Save": "Edit"}
                </Button>
            </div>
        </div>
        <div className="flex flex-col w-full p-4 gap-3">
            <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-semibold text-gray-800">First Name</p>
                <Input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => handleChange("firstname", e.target.value)}
                    disabled={!isEditing}
                    className="border border-gray-100"
                />
            </div>
            <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-semibold text-gray-800">Last Name</p>
                <Input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => handleChange("lastname", e.target.value)}
                    disabled={!isEditing}
                    className="border border-gray-100"
                />
            </div>
            <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-semibold text-gray-800">Email Address</p>
                <div className="relative flex-[2]">
                    <MdOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <Input
                      type="text"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled={true}
                      className="border border-gray-100 pl-10 pr-3 py-2 border-gray-100"
                    ></Input>
                </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-semibold text-gray-800">Phone Number</p>
                <div className="relative flex-[2]">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <Input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      disabled={!isEditing}
                      className="border border-gray-100 pl-10 pr-3 py-2 border-gray-100"
                    ></Input>
                </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-semibold text-gray-800">Faculty</p>
                <div className="relative flex-[2]">
                    <MdOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <Input
                        type="text"
                        placeholder={props.faculty}
                        disabled={true}
                        className="border border-gray-100 pl-10 pr-3 py-2 border-gray-100"
                    ></Input>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentInfoCard;
