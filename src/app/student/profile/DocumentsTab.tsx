"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types/user";
import { FileMeta } from "@/types/file";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { IoDocumentTextOutline, IoTrashOutline } from "react-icons/io5";
import FileUpload from "@/components/FileUpload";

interface DocumentsTabProps {
  student: Student;
  onUpdate: () => void;
}

interface DocumentSectionProps {
  title: string;
  documents: FileMeta[];
  docTypeId: number;
  onUpload: (file: File, docTypeId: number) => void;
  onDelete: (docId: number) => void;
  uploading: boolean;
}

function DocumentSection({ title, documents, docTypeId, onUpload, onDelete, uploading }: DocumentSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-upload when file is selected
  useEffect(() => {
    if (selectedFile) {
      onUpload(selectedFile, docTypeId);
      setSelectedFile(null);
    }
  }, [selectedFile, docTypeId, onUpload]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {/* Upload Section using FileUpload component */}
      <FileUpload
        title={`Upload ${title}`}
        acceptedTypes={["pdf"]}
        onFileSelect={setSelectedFile}
        selectedFile={selectedFile}
      />

      {uploading && (
        <div className="text-center text-sm text-gray-600">
          Uploading...
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} uploaded yet</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <IoDocumentTextOutline className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(doc.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <IoTrashOutline className="w-5 h-5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DocumentsTab({ student, onUpdate }: DocumentsTabProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, docTypeId: number) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docTypeId", String(docTypeId));

    try {
      const res = await fetch("/api/students/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Failed to upload document");
        return;
      }

      toast.success("Document uploaded successfully");
      onUpdate();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const res = await fetch(`/api/students/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete document");
        return;
      }

      toast.success("Document deleted successfully");
      onUpdate();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error deleting document");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Documents</CardTitle>
        <CardDescription>Upload and manage your resumes, CVs, portfolios, and transcripts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <DocumentSection
          data-testid="student-upload-resume-section"
          title="Resume"
          documents={student.documents.resume}
          docTypeId={1}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading}
        />

        <div className="border-t pt-8">
          <DocumentSection
            data-testid="student-upload-cv-section"
            title="CV"
            documents={student.documents.cv}
            docTypeId={2}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploading}
          />
        </div>

        <div className="border-t pt-8">
          <DocumentSection
            data-testid="student-upload-portfolio-section"
            title="Portfolio"
            documents={student.documents.portfolio}
            docTypeId={3}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploading}
          />
        </div>

        <div className="border-t pt-8">
          <DocumentSection
            data-testid="student-upload-transcript-section"
            title="Transcript"
            documents={student.documents.transcript || []}
            docTypeId={4}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
