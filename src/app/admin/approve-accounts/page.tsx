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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  MapPin,
  Phone,
  Globe,
  Search,
  GraduationCap,
  Building2,
  UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";

interface Document {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
  documentType: {
    name: string;
  };
}

interface PendingAccount {
  type: "student" | "company";
  id: number;
  accountId: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  details: {
    // Student details
    studentId?: string;
    faculty?: string;
    year?: string;
    phone?: string;
    transcript?: string;
    isReapplication?: boolean;
    // Company details
    address?: string;
    description?: string;
    website?: string;
    // Common
    documents: Document[];
  };
}

export default function ApproveAccountsPage() {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Document viewer modal
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "student" | "company">("all");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    fetchPendingAccounts();
  }, [statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, typeFilter, accounts]);

  const fetchPendingAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      params.append("status", statusFilter);

      const response = await fetch(`/api/admin/accounts/pending?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        toast.error("Failed to fetch pending accounts");
      }
    } catch (error) {
      toast.error("Error fetching accounts");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(acc => acc.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(acc =>
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.details.studentId && acc.details.studentId.includes(searchQuery))
      );
    }

    setFilteredAccounts(filtered);
  };

  const handleAction = async (accountId: number, accountType: string, action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/accounts/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          accountType,
          action,
          reason: action === "reject" ? reason : undefined,
        }),
      });

      if (response.ok) {
        toast.success(`${accountType.charAt(0).toUpperCase() + accountType.slice(1)} ${action}d successfully`);
        setAccounts(accounts.filter(a => a.id !== accountId || a.type !== accountType));
        setIsDialogOpen(false);
        setSelectedAccount(null);
        setReason("");
      } else {
        toast.error(`Failed to ${action} ${accountType}`);
      }
    } catch (error) {
      toast.error("Error processing request");
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (account: PendingAccount, action: "approve" | "reject") => {
    setSelectedAccount(account);
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

  const viewDocument = (documentId: number, fileName: string) => {
    setSelectedDocId(documentId);
    setSelectedDocName(fileName);
    setIsDocViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading pending accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Approval</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve student and company registrations
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredAccounts.length} pending approval{filteredAccounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | "student" | "company")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                  <SelectItem value="company">Companies Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "pending" | "approved" | "rejected" | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="approved">✅ Approved</SelectItem>
                  <SelectItem value="rejected">❌ Rejected</SelectItem>
                  <SelectItem value="all">All Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">No pending accounts</p>
              <p className="text-muted-foreground">All accounts have been reviewed</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAccounts.map((account) => (
            <Card key={`${account.type}-${account.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {account.type === "student" ? (
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{account.name}</CardTitle>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          account.type === "student"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {account.type === "student" ? "Alumni" : "Company"}
                        </span>
                        {account.details.isReapplication && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
                            Re-application
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        Registered on {formatDate(account.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActionDialog(account, "approve")}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActionDialog(account, "reject")}
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
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{account.email}</span>
                    </div>
                    {account.type === "student" && account.details.studentId && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Student ID: {account.details.studentId}</span>
                      </div>
                    )}
                    {account.details.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{account.details.phone}</span>
                      </div>
                    )}
                    {account.type === "company" && account.details.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{account.details.address}</span>
                      </div>
                    )}
                    {account.details.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={account.details.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {account.details.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    {account.type === "student" && account.details.faculty && (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">Faculty & Year:</p>
                        <p className="text-sm">{account.details.faculty}</p>
                        <p className="text-sm">Year: {account.details.year}</p>
                      </>
                    )}
                    {account.type === "company" && account.details.description && (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">Description:</p>
                        <p className="text-sm">{account.details.description}</p>
                      </>
                    )}
                  </div>
                </div>

                {account.details.documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      {account.type === "student" ? "Transcript:" : "Evidence Documents:"}
                    </p>
                    <div className="space-y-2">
                      {account.details.documents.map((doc) => (
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
                            onClick={() => viewDocument(doc.id, doc.file_name)}
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

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Account" : "Reject Account"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? `Are you sure you want to approve ${selectedAccount?.name}'s ${selectedAccount?.type} account? ${
                    selectedAccount?.type === "student"
                      ? "They will need to verify their email before applying for jobs."
                      : "They will be able to post jobs and manage applications."
                  }`
                : `Are you sure you want to reject ${selectedAccount?.name}'s ${selectedAccount?.type} account? Please provide a reason for rejection.`
              }
            </DialogDescription>
          </DialogHeader>

          {action === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for rejection</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejecting this account..."
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
                setSelectedAccount(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={() => selectedAccount && handleAction(selectedAccount.id, selectedAccount.type, action!)}
              disabled={processing || (action === "reject" && !reason.trim())}
            >
              {processing ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        documentId={selectedDocId}
        fileName={selectedDocName}
      />
    </div>
  );
}
