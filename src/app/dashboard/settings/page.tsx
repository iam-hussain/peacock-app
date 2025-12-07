"use client";

import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calculator,
  Database,
  Download,
  FileSpreadsheet,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/atoms/data-table";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { MemberFormDialog } from "@/components/molecules/member-form-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileDateTime } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { fetchMembers } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";
import { TransformedMember } from "@/transformers/account";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: membersData, isLoading: membersLoading } =
    useQuery(fetchMembers());
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<
    TransformedMember["account"] | null
  >(null);
  const [recalculateReturnsDialogOpen, setRecalculateReturnsDialogOpen] =
    useState(false);
  const [recalculateLoansDialogOpen, setRecalculateLoansDialogOpen] =
    useState(false);
  const [backupDownloadLink, setBackupDownloadLink] = useState<string | null>(
    null
  );

  // System Tools Mutations
  const returnsMutation = useMutation({
    mutationFn: () => fetcher.post("/api/action/recalculate"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all"] });
      toast.success("Returns are recalculated successfully.");
      setRecalculateReturnsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const loanMutation = useMutation({
    mutationFn: () => fetcher.post("/api/action/recalculate/loan"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all"] });
      toast.success("Loans are recalculated successfully.");
      setRecalculateLoansDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => fetcher.post("/api/action/backup"),
    onSuccess: async (data: any) => {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob);
      setBackupDownloadLink(downloadUrl);
      toast.success("Data backup done successfully, download now.");
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const handleAddMember = () => {
    setSelectedMember(null);
    setMemberDialogOpen(true);
  };

  const handleEditMember = (member: TransformedMember) => {
    setSelectedMember(member.account);
    setMemberDialogOpen(true);
  };

  // Member Management Table Columns
  const memberColumns: ColumnDef<TransformedMember>[] = useMemo(
    () => [
      {
        id: "member",
        accessorKey: "name",
        header: "Member",
        enableSorting: true,
        meta: {
          tooltip: "Member name, avatar and status.",
        },
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {member.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      member.active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {member.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "fundsManaged",
        accessorKey: "fundsManaged",
        header: "Funds Managed",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total club funds currently managed by this member.",
        },
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium text-foreground">
            {moneyFormat(row.original.fundsManaged || 0)}
          </div>
        ),
      },
      {
        id: "totalDeposits",
        accessorKey: "totalDepositAmount",
        header: "Deposits",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total deposits contributed by this member.",
        },
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium text-foreground">
            {moneyFormat(row.original.totalDepositAmount || 0)}
          </div>
        ),
      },
      {
        id: "currentValue",
        accessorKey: "currentValue",
        header: "Current Value",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Current value of this member's position including profit.",
        },
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium text-foreground">
            {moneyFormat(row.original.currentValue || 0)}
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "active",
        header: "Status",
        enableSorting: true,
        meta: {
          tooltip: "Member status (Active/Inactive).",
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                row.original.active ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {row.original.active ? "Active" : "Inactive"}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <MoreHorizontal className="h-4 w-4" />,
        enableSorting: false,
        meta: {
          tooltip: "More member actions.",
        },
        cell: ({ row }) => {
          const member = row.original;
          return (
            <RowActionsMenu
              onViewDetails={() => handleEditMember(member)}
              onEdit={() => handleEditMember(member)}
            />
          );
        },
      },
    ],
    []
  );

  const members = membersData?.members || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">Settings</span>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage system maintenance, members, and user access"
      />

      {/* System Tools Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>
            Run safe maintenance actions on financial data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recalculate Returns */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-lg p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Recalculate Returns
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recompute all member returns based on the latest rules.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRecalculateReturnsDialogOpen(true)}
              disabled={
                returnsMutation.isPending ||
                loanMutation.isPending ||
                backupMutation.isPending
              }
            >
              {returnsMutation.isPending ? "Running..." : "Run Recalculation"}
            </Button>
          </div>

          {/* Recalculate Loans */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-lg p-2.5 bg-green-500/10 text-green-600 dark:text-green-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Recalculate Loans
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recompute all loan balances and interest.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRecalculateLoansDialogOpen(true)}
              disabled={
                returnsMutation.isPending ||
                loanMutation.isPending ||
                backupMutation.isPending
              }
            >
              {loanMutation.isPending ? "Running..." : "Run Recalculation"}
            </Button>
          </div>

          {/* Backup Data */}
          <div className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4 flex-1">
              <div className="rounded-lg p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Database className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Backup Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a full backup of club data before running large
                  changes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {backupDownloadLink && (
                <a
                  href={backupDownloadLink}
                  download={`peacock_backup_${fileDateTime()}.json`}
                  className="text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => backupMutation.mutate()}
                disabled={
                  returnsMutation.isPending ||
                  loanMutation.isPending ||
                  backupMutation.isPending
                }
              >
                {backupMutation.isPending ? "Backing up..." : "Create Backup"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Management Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>
                Admin-only controls to add, edit, or adjust members
              </CardDescription>
            </div>
            <Button onClick={handleAddMember} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={memberColumns}
            data={members}
            frozenColumnKey="member"
            isLoading={membersLoading}
          />
        </CardContent>
      </Card>

      {/* User & Access Management Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>User & Access Management</CardTitle>
          <CardDescription>
            Control user accounts and passwords (Super Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              User management features will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recalculate Returns Confirmation Dialog */}
      <Dialog
        open={recalculateReturnsDialogOpen}
        onOpenChange={setRecalculateReturnsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalculate Returns?</DialogTitle>
            <DialogDescription>
              This will recompute returns for all members. It won&apos;t delete
              data but may update balances.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecalculateReturnsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => returnsMutation.mutate()}
              disabled={returnsMutation.isPending}
            >
              {returnsMutation.isPending ? "Running..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recalculate Loans Confirmation Dialog */}
      <Dialog
        open={recalculateLoansDialogOpen}
        onOpenChange={setRecalculateLoansDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalculate Loans?</DialogTitle>
            <DialogDescription>
              This will recompute all loan balances and interest. It won&apos;t
              delete data but may update balances.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecalculateLoansDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => loanMutation.mutate()}
              disabled={loanMutation.isPending}
            >
              {loanMutation.isPending ? "Running..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Form Dialog */}
      <MemberFormDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        selected={selectedMember}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
