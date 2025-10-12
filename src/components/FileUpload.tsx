"use client";

import React, { useRef, useState } from "react";
import { PiUploadSimpleBold } from "react-icons/pi";
import { IoDocumentTextOutline } from "react-icons/io5";

interface FileUploadProps {
  title: string;
  acceptedTypes: string[];
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

const FileUpload = (props: FileUploadProps) => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    fileInput.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      props.onFileSelect(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      props.onFileSelect(files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col gap-2 shadow-md justify-center items-center w-full rounded-md p-6 border-2 border-dashed cursor-pointer transition ${
        isDragging
          ? "border-[#10B981] bg-[#10B981]/10"
          : "border-gray-300 hover:bg-gray-50"
      }`}
    >
      <PiUploadSimpleBold className="w-7 h-7 text-[#1FD29A]" />
      <p className="font-semibold text-sm">{props.title}</p>
      <p className="text-sm text-gray-600">
        {props.acceptedTypes.map((type) => type.toUpperCase()).join(", ")} files
      </p>

      <div className="flex flex-row gap-1 bg-[#10B981] rounded-md shadow-sm px-3 py-1 mt-2 text-white hover:bg-[#059669] transition">
        <IoDocumentTextOutline className="w-4 h-4" />
        <p className="text-sm">Choose file</p>
      </div>

      <input
        type="file"
        ref={fileInput}
        accept={props.acceptedTypes.map((t) => `.${t}`).join(",")}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default FileUpload;
