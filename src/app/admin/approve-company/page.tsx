"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface CompanyEvidence {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
  documentType: {
    name: string;
  };
}

interface PendingCompany {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string;
  website: string | null;
  register_day: string;
  registration_status: string;
  account: {
    email: string;
    documents: CompanyEvidence[];
  };
}

export default function ApproveCompanyPage() {
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<PendingCompany | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies/pending");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        toast.error("Failed to fetch pending companies");
      }
    } catch (error) {
      toast.error("Error fetching companies");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (companyId: number, action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/companies/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          action,
          reason: action === "reject" ? reason : undefined,
        }),
      });

      if (response.ok) {
        toast.success(`Company ${action}d successfully`);
        setCompanies(companies.filter(c => c.id !== companyId));
        setIsDialogOpen(false);
        setSelectedCompany(null);
        setReason("");
      } else {
        toast.error(`Failed to ${action} company`);
      }
    } catch (error) {
      toast.error("Error processing request");
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (company: PendingCompany, action: "approve" | "reject") => {
    setSelectedCompany(company);
    setAction(action);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      // This would need to be implemented based on your file storage solution
      // For now, we'll just show a toast
      toast.info(`Downloading ${fileName}`);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading pending companies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Approval</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve company registrations with evidence documents
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {companies.length} pending approval{companies.length !== 1 ? 's' : ''}
        </div>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">No pending companies</p>
              <p className="text-muted-foreground">All companies have been reviewed</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Registered on {formatDate(company.register_day)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActionDialog(company, "approve")}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActionDialog(company, "reject")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{company.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{company.phone}</span>
                    </div>
                    {company.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description:</p>
                    <p className="text-sm">{company.description}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Contact Email:</p>
                  <p className="text-sm text-muted-foreground">{company.account.email}</p>
                </div>

                {company.account.documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Evidence Documents:</p>
                    <div className="space-y-2">
                      {company.account.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getFileExtension(doc.file_name)} • {formatDate(doc.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(doc.file_path, doc.file_name)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Company" : "Reject Company"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? `Are you sure you want to approve ${selectedCompany?.name}? This will allow them to post jobs and manage applications.`
                : `Are you sure you want to reject ${selectedCompany?.name}? Please provide a reason for rejection.`
              }
            </DialogDescription>
          </DialogHeader>

          {action === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for rejection</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejecting this company..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedCompany(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={() => selectedCompany && handleAction(selectedCompany.id, action!)}
              disabled={processing || (action === "reject" && !reason.trim())}
            >
              {processing ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
