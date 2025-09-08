"use client";
import React, { useEffect } from "react";
import { LuFolderClosed } from "react-icons/lu";
import { IoDocumentTextOutline } from "react-icons/io5";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileMeta } from "@/types/file";


interface DocumentSelectorProps {
  title: string;
  description: string;
  existingFiles: FileMeta[];
  onFileSelect: (file: FileMeta | null) => void;
  selectedFile: FileMeta | null;
}


const DocumentSelector = (props: DocumentSelectorProps) => {
    useEffect(() => {
        console.log(props.selectedFile)
      }, [props.selectedFile]);
      

  const handleSelect = (file: any) => {
    props.onFileSelect(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col gap-2 shadow-md justify-center items-center w-full rounded-md p-4 border border-gray-100 cursor-pointer hover:bg-gray-50">
          <LuFolderClosed className="w-6 h-6 text-[#098760]" />
          <p className="font-semibold text-sm">{props.title}</p>
          <p className="text-sm text-gray-600">{props.description}</p>
          <div className="flex flex-row gap-1 bg-[#1FD29A] rounded-md shadow-sm px-3 py-1 mt-2">
            <IoDocumentTextOutline className="w-4 h-4" />
            <p className="text-sm">Choose file</p>
          </div>
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
            }`}
          >
            <p className="text-sm">{file.name}</p>
          </div>
          
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSelector;
