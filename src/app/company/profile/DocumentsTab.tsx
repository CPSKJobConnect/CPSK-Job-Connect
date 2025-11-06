"use client";

import { useState, useEffect } from "react";
import { Company } from "@/types/user";
import { FileMeta } from "@/types/file";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { IoDocumentTextOutline, IoTrashOutline } from "react-icons/io5";
import FileUpload from "@/components/FileUpload";

interface DocumentsTabProps {
  company: Company;
  onUpdate: () => void;
}

interface DocumentSectionProps {
  title: string;
  description: string;
  documents: FileMeta[];
  docTypeId: number;
  onUpload: (file: File, docTypeId: number) => void;
  onDelete: (docId: number) => void;
  uploading: boolean;
  showReapplicationWarning?: boolean;
}

function DocumentSection({
  title,
  description,
  documents,
  docTypeId,
  onUpload,
  onDelete,
  uploading,
  showReapplicationWarning
}: DocumentSectionProps) {
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
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {showReapplicationWarning && (
        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
          <p className="text-sm font-semibold text-orange-900">Re-application Required</p>
          <p className="text-sm text-orange-800 mt-1">
            Upload new company evidence to re-apply for verification. Your status will be reset to PENDING and admins will be notified.
          </p>
        </div>
      )}

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

export default function DocumentsTab({ company, onUpdate }: DocumentsTabProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, docTypeId: number) => {
    setUploading(true);

    try {
      // For rejected companies uploading evidence (docTypeId 7), use re-application endpoint
      const isEvidence = docTypeId === 7;
      const isRejected = company.registration_status === "REJECTED";

      if (isEvidence && isRejected) {
        // Use special re-application endpoint
        const reapplyFormData = new FormData();
        reapplyFormData.append("evidence", file);

        const res = await fetch("/api/company/reapply-verification", {
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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("docTypeId", String(docTypeId));

        const res = await fetch("/api/company/documents", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to upload document");
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
      const res = await fetch(`/api/company/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to delete document");
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
        <CardTitle>Company Documents</CardTitle>
        <CardDescription>Upload and manage your company verification evidence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <DocumentSection
          title="Company Evidence"
          description="Upload official documents proving your company registration (e.g., business license, incorporation certificate)"
          documents={company.documents.evidence}
          docTypeId={7}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploading}
          showReapplicationWarning={company.registration_status === "REJECTED"}
        />
      </CardContent>
    </Card>
  );
}
