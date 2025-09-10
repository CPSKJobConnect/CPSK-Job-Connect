"use client";
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import DocumentSelector from "@/components/DocumentSelector";
import { IoMdClose } from "react-icons/io";
import { FileMeta } from "@/types/file";

interface DocumentUploadSectionProps {
    title: string;
    description: string;
    uploadedFile: File | null;
    setUploadedFile: (file: File | null) => void;
    selectedFile: FileMeta | null;
    setSelectedFile: (file: FileMeta | null) => void;
    existingFiles: FileMeta[];
    acceptedTypes?: string[];
}

  
const DocumentUploadSection = ({
    title,
    description,
    uploadedFile,
    setUploadedFile,
    selectedFile,
    setSelectedFile,
    existingFiles,
    acceptedTypes = ['pdf','doc','docx']
  }: DocumentUploadSectionProps) => {

    const handleRemove = (): void => {
      setUploadedFile(null);
      setSelectedFile(null);
    };

    const handleUploadFile = (file: File | null): void => {
      setSelectedFile(null);
      setUploadedFile(file);
    }

    const handleSelectExistingFile = (file: FileMeta | null): void => {
      setUploadedFile(null);
      setSelectedFile(file);
    }

    return (
      <div className="shadow-md w-full h-full rounded-md border border-gray-100/70">
      <div className="px-10 mt-3">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="px-10 py-3">
      {(selectedFile || uploadedFile) && (
        <div className="flex flex-col justify-center w-full bg-[#F3FEFA] rounded-md p-2">
          <div className="flex flex-row justify-between items-center">
            <p className="text-sm text-gray-700 max-w-[90%] truncate">
              Selected: <span className="font-medium">{selectedFile ? selectedFile.name : uploadedFile?.name}</span>
            </p>
            <IoMdClose
              className="w-5 h-5 text-gray-500 cursor-pointer hover:text-red-500"
              onClick={handleRemove}
            />
          </div>
        </div>
      )}
      </div>
      <div className="flex flex-col gap-5 px-8 py-2 mb-5">
        <DocumentSelector
          title={`Select Existing ${title}`}
          description="Choose from uploaded files"
          existingFiles={existingFiles}
          onFileSelect={handleSelectExistingFile}
          selectedFile={selectedFile}
        />
        <FileUpload
          title={`Upload ${title}`}
          acceptedTypes={acceptedTypes}
          onFileSelect={handleUploadFile}
          selectedFile={uploadedFile}
        />
      </div>
    </div>
  );
};

export default DocumentUploadSection;