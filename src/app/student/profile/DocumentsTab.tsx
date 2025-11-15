"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types/user";
import { FileMeta } from "@/types/file";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { IoDocumentTextOutline, IoTrashOutline, IoEyeOutline } from "react-icons/io5";
import FileUpload from "@/components/FileUpload";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";

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
  onViewDocument: (docId: number, fileName: string) => void;
}

function DocumentSection({ title, documents, docTypeId, onUpload, onDelete, uploading, onViewDocument }: DocumentSectionProps) {
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDocument(doc.id, doc.name)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <IoEyeOutline className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(doc.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <IoTrashOutline className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DocumentsTab({ student, onUpdate }: DocumentsTabProps) {
  const [uploading, setUploading] = useState(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState("");

  const handleUpload = async (file: File, docTypeId: number) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docTypeId", String(docTypeId));

    try {
      // For rejected alumni uploading transcript (docTypeId 4), use re-application endpoint
      const isTranscript = docTypeId === 4;
      const isRejectedAlumni = student.student_status === "ALUMNI" && student.verification_status === "REJECTED";

      if (isTranscript && isRejectedAlumni) {
        // Use special re-application endpoint
        const reapplyFormData = new FormData();
        reapplyFormData.append("transcript", file);

        const res = await fetch("/api/students/reapply-verification", {
          method: "POST",
          body: reapplyFormData,
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to submit re-application");
          return;
        }

        toast.success("Re-application submitted successfully! Your verification is now pending admin review.");
        onUpdate();
      } else {
        // Regular document upload
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
      }
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

  const handleViewDocument = (docId: number, fileName: string) => {
    setSelectedDocId(docId);
    setSelectedDocName(fileName);
    setIsDocViewerOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>Upload and manage your resumes, CVs, portfolios, and transcripts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <DocumentSection
            title="Resume"
            documents={student.documents.resume}
            docTypeId={1}
            onUpload={handleUpload}
            onDelete={handleDelete}
            uploading={uploading}
            onViewDocument={handleViewDocument}
          />

          <div className="border-t pt-8">
            <DocumentSection
              title="CV"
              documents={student.documents.cv}
              docTypeId={2}
              onUpload={handleUpload}
              onDelete={handleDelete}
              uploading={uploading}
              onViewDocument={handleViewDocument}
            />
          </div>

          <div className="border-t pt-8">
            <DocumentSection
              title="Portfolio"
              documents={student.documents.portfolio}
              docTypeId={3}
              onUpload={handleUpload}
              onDelete={handleDelete}
              uploading={uploading}
              onViewDocument={handleViewDocument}
            />
          </div>

          <div className="border-t pt-8">
            {student.student_status === "ALUMNI" && student.verification_status === "REJECTED" && (
              <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-sm font-semibold text-orange-900">Re-application Required</p>
                <p className="text-sm text-orange-800 mt-1">
                  Upload a new transcript to re-apply for verification. Your status will be reset to PENDING and admins will be notified.
                </p>
              </div>
            )}
            <DocumentSection
              title="Transcript"
              documents={student.documents.transcript || []}
              docTypeId={4}
              onUpload={handleUpload}
              onDelete={handleDelete}
              uploading={uploading}
              onViewDocument={handleViewDocument}
            />
          </div>
        </CardContent>
      </Card>

      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        documentId={selectedDocId}
        fileName={selectedDocName}
        apiEndpoint="students"
      />
    </>
  );
}
