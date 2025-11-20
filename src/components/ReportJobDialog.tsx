"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { toast } from "sonner";
import apiFetch from "@/lib/apiClient";

interface ReportJobDialogProps {
  targetId: string | number;
  targetType?: "POST" | "GENERAL";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportType {
  id: number;
  name: string;
  target: string;
}

export const ReportJobDialog = ({
  targetId,
  targetType,
  open,
  onOpenChange,
}: ReportJobDialogProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);

  useEffect(() => {
    if (!open) return;

    const fetchReportTypes = async () => {
      try {
        const res = await fetch(`/api/reports/filter?target=${targetType}`);
        if (!res.ok) throw new Error("Failed to fetch report types");
        const data = await res.json();
        setReportTypes(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load report reasons");
      }
    };

    fetchReportTypes();
  }, [open, targetType]);

  const handleSubmit = async () => {
    if (!reason) return toast.error("Please select a reason");
    if (!description.trim()) return toast.error("Please provide a description");

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: Number(targetId),
          report_type_id: Number(reason),
          description: description.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Report submitted successfully. We'll review it shortly.");
        onOpenChange(false);
        setReason("");
        setDescription("");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to submit report");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = targetType === "POST" ? "Report Job Post" : "Report General Problem";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{description.length}/500</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || !description.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
