"use client";
import React from "react";
import { useEffect } from "react";
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
