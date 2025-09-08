"use client";
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

  
export const DocumentUploadSection = ({
    title,
    description,
    uploadedFile,
    setUploadedFile,
    selectedFile,
    setSelectedFile,
    existingFiles,
    acceptedTypes = ['pdf','doc','docx']
  }: DocumentUploadSectionProps) => (
    <div>
      <div className="px-10">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="px-10 py-3">
        {(selectedFile || uploadedFile) && (
          <div className="flex flex-col justify-center w-full bg-[#F3FEFA] rounded-md p-2">
            <div className="flex flex-row justify-between items-center">
              <p className="text-sm text-gray-700">
                Selected: <span className="font-medium">{selectedFile ? selectedFile.name: uploadedFile?.name}</span>
              </p>
              <IoMdClose
                className="w-5 h-5 text-gray-500 cursor-pointer hover:text-red-500"
                onClick={() => setSelectedFile(null)}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-5 px-8 py-3">
        <FileUpload
          title={`Upload ${title}`}
          acceptedTypes={acceptedTypes}
          onFileSelect={setUploadedFile}
          selectedFile={uploadedFile}
        />
        <DocumentSelector
          title={`Select Existing ${title}`}
          description="Choose from uploaded files"
          existingFiles={existingFiles}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
        />
      </div>
    </div>
  )