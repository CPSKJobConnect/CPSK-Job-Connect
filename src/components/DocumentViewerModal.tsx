"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  ExternalLink,
  File,
  FileText,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number | null;
  fileName: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  documentId,
  fileName,
}: DocumentViewerModalProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<"pdf" | "image" | "other">("other");

  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocumentUrl();
    } else if (!isOpen) {
      // Reset state when modal closes
      setDocumentUrl(null);
      setLoading(false);
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension === "pdf") {
        setFileType("pdf");
      } else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
        setFileType("image");
      } else {
        setFileType("other");
      }
    }
  }, [fileName]);

  const fetchDocumentUrl = async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/documents/view/${documentId}`);

      if (!response.ok) {
        toast.error("Failed to get document URL");
        onClose();
        return;
      }

      const data = await response.json();
      setDocumentUrl(data.url);
    } catch (error) {
      console.error("Error fetching document:", error);
      toast.error("Failed to load document");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentUrl) return;

    try {
      toast.loading("Preparing download...");

      // Fetch the file as a blob to handle CORS issues
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      toast.dismiss();
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss();
      toast.error("Failed to download file");
    }
  };

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
      toast.success(`Opening ${fileName} in new tab`);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "image":
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getFileIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle
                  className="text-lg font-semibold truncate"
                  title={fileName}
                >
                  {fileName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {fileType.toUpperCase()} Document
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!documentUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!documentUrl}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Tab
              </Button>

            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Loading document...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          ) : documentUrl ? (
            <div className="h-full w-full">
              {fileType === "pdf" ? (
                <iframe
                  src={`${documentUrl}#view=FitH`}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              ) : fileType === "image" ? (
                <div className="h-full w-full flex items-center justify-center p-6 relative">
                  <Image
                    src={documentUrl}
                    alt={fileName}
                    fill
                    className="object-contain rounded-lg shadow-lg"
                    sizes="(max-width: 95vw) 95vw, 90vh"
                    priority
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <File className="w-24 h-24 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Preview not available</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    This file type cannot be previewed in the browser
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                    <Button variant="outline" onClick={handleOpenInNewTab}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
