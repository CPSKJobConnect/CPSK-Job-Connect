"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileMeta } from "@/types/file";
import { IoEyeOutline } from "react-icons/io5";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";


interface DocumentSelectorProps {
  title: string;
  description: string;
  existingFiles: FileMeta[];
  onFileSelect: (file: FileMeta | null) => void;
  selectedFile: FileMeta | null;
}


const DocumentSelector = (props: DocumentSelectorProps) => {
    const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [selectedDocName, setSelectedDocName] = useState("");

    useEffect(() => {
        console.log(props.selectedFile)
      }, [props.selectedFile]);


  const handleSelect = (file: FileMeta) => {
    props.onFileSelect(file);
  };

  const handleViewDocument = (e: React.MouseEvent, docId: number, fileName: string) => {
    e.stopPropagation();
    setSelectedDocId(docId);
    setSelectedDocName(fileName);
    setIsDocViewerOpen(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div 
        className="flex shadow-md justify-center items-center w-full rounded-sm px-4 py-1 cursor-pointer bg-[#ABE9D6] hover:bg-[#2DA68C] hover:text-white text-gray-700 text-sm font-semibold"
        >
          <p>{props.title}</p>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          {props.existingFiles.map((file, index) => (
            <div
            key={index}
            onClick={() => handleSelect(file)}
            className={`p-2 border rounded-md cursor-pointer hover:bg-gray-100 ${
              props.selectedFile && 'name' in props.selectedFile && props.selectedFile.name === file.name
                ? "bg-[#F3FEFA]"
                : "border-gray-200"
            } flex items-center justify-between`}
          >
            <p className="text-sm flex-1">{file.name}</p>
            <button
              onClick={(e) => handleViewDocument(e, file.id, file.name)}
              className="p-1 hover:bg-blue-100 rounded-md text-blue-600 transition-colors"
              title="Preview document"
            >
              <IoEyeOutline className="w-5 h-5" />
            </button>
          </div>

          ))}
        </div>
      </DialogContent>

      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        documentId={selectedDocId}
        fileName={selectedDocName}
        apiEndpoint="students"
      />
    </Dialog>
  );
};

export default DocumentSelector;
