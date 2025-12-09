"use client";

export const dynamic = "force-dynamic";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Briefcase,
  Calculator,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TransformedVendor } from "@/app/api/account/vendor/route";
import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { DataTable } from "@/components/atoms/data-table";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { MemberAdjustmentsDialog } from "@/components/molecules/member-adjustments-dialog";
import { MemberFormDialog } from "@/components/molecules/member-form-dialog";
import { MemberPermissionCard } from "@/components/molecules/member-permission-card";
import { SmartAccessToggle } from "@/components/molecules/smart-access-toggle";
import { VendorFormDialog } from "@/components/molecules/vendor-form-dialog";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/hooks/use-auth";
import { fileDateTime } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { fetchMembers, fetchVendors } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";
import { TransformedMember } from "@/transformers/account";

export default function SettingsPage() {
  const { isAdmin, canManageAccounts } = useAuth();
  const queryClient = useQueryClient();

  // Track access state for each member to handle optimistic updates
  const [memberAccessState, setMemberAccessState] = useState<
    Record<
      string,
      {
        read: boolean;
        write: boolean;
        admin: boolean;
      }
    >
  >({});
  const { data: membersData, isLoading: membersLoading } =
    useQuery(fetchMembers());
  const { data: vendorsData, isLoading: vendorsLoading } =
    useQuery(fetchVendors());

  // Clear optimistic state when members data is refetched
  useEffect(() => {
    if (membersData?.members) {
      setMemberAccessState({});
    }
  }, [membersData]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<
    TransformedMember["account"] | null
  >(null);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<
    TransformedVendor["account"] | null
  >(null);
  const [adjustmentsDialogOpen, setAdjustmentsDialogOpen] = useState(false);
  const [selectedMemberForAdjustments, setSelectedMemberForAdjustments] =
    useState<TransformedMember | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedMemberForPasswordReset, setSelectedMemberForPasswordReset] =
    useState<TransformedMember | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
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

  const handleEditMember = useCallback((member: TransformedMember) => {
    setSelectedMember(member.account);
    setMemberDialogOpen(true);
  }, []);

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setVendorDialogOpen(true);
  };

  const handleEditVendor = useCallback((vendor: TransformedVendor) => {
    setSelectedVendor(vendor.account);
    setVendorDialogOpen(true);
  }, []);

  const handleAdjustments = useCallback((member: TransformedMember) => {
    setSelectedMemberForAdjustments(member);
    setAdjustmentsDialogOpen(true);
  }, []);

  const handleResetPassword = useCallback((member: TransformedMember) => {
    setSelectedMemberForPasswordReset(member);
    setResetPasswordDialogOpen(true);
    setNewPassword(null);
  }, []);

  const resetPasswordMutation = useMutation({
    mutationFn: (memberId: string) =>
      fetcher.post(`/api/admin/members/${memberId}/reset-password`),
    onSuccess: async (data: { newPassword: string }) => {
      setNewPassword(data.newPassword);
      await queryClient.invalidateQueries({ queryKey: ["all"] });
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Failed to reset password. Please try again."
      );
    },
  });

  const handleConfirmResetPassword = () => {
    if (selectedMemberForPasswordReset) {
      resetPasswordMutation.mutate(selectedMemberForPasswordReset.account.id);
    }
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
              <ClickableAvatar
                src={member.avatar}
                alt={member.name}
                name={member.name}
                href={member.link}
                size="md"
              />
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
        accessorKey: "clubHeldAmount",
        header: "Managed Funds",
        enableSorting: true,
        meta: {
          tooltip: "Total club funds currently managed by this member.",
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {moneyFormat(row.original.clubHeldAmount || 0)}
          </div>
        ),
      },
      {
        id: "readAccess",
        accessorKey: "account.readAccess",
        header: "Read",
        enableSorting: true,
        meta: {
          tooltip:
            "Read-only access. Can view dashboard and data but cannot create or edit anything.",
          align: "center",
        },
        cell: ({ row }) => {
          const member = row.original;
          const memberState = memberAccessState[member.account.id];
          const currentRead = memberState?.read ?? member.account.readAccess;
          const currentWrite = memberState?.write ?? member.account.writeAccess;
          const currentAdmin =
            memberState?.admin ?? member.account.role === "ADMIN";

          if (!isAdmin) {
            return (
              <div className="flex items-center justify-center">
                <span
                  className={`text-xs font-medium ${
                    currentRead
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentRead ? "Yes" : "No"}
                </span>
              </div>
            );
          }

          return (
            <SmartAccessToggle
              memberId={member.account.id}
              memberName={member.name}
              currentRead={currentRead}
              currentWrite={currentWrite}
              currentAdmin={currentAdmin}
              accessType="read"
              onStateChange={(newState) => {
                setMemberAccessState((prev) => ({
                  ...prev,
                  [member.account.id]: newState,
                }));
              }}
            />
          );
        },
      },
      {
        id: "writeAccess",
        accessorKey: "account.writeAccess",
        header: "Write",
        enableSorting: true,
        meta: {
          tooltip:
            "Write access is restricted to creating and updating transactions only. It does not provide permissions to modify users, vendors, members, or system configurations. Write access includes Read permission.",
          align: "center",
        },
        cell: ({ row }) => {
          const member = row.original;
          const memberState = memberAccessState[member.account.id];
          const currentRead = memberState?.read ?? member.account.readAccess;
          const currentWrite = memberState?.write ?? member.account.writeAccess;
          const currentAdmin =
            memberState?.admin ?? member.account.role === "ADMIN";

          if (!isAdmin) {
            return (
              <div className="flex items-center justify-center">
                <span
                  className={`text-xs font-medium ${
                    currentWrite
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentWrite ? "Yes" : "No"}
                </span>
              </div>
            );
          }

          return (
            <SmartAccessToggle
              memberId={member.account.id}
              memberName={member.name}
              currentRead={currentRead}
              currentWrite={currentWrite}
              currentAdmin={currentAdmin}
              accessType="write"
              onStateChange={(newState) => {
                setMemberAccessState((prev) => ({
                  ...prev,
                  [member.account.id]: newState,
                }));
              }}
            />
          );
        },
      },
      {
        id: "adminAccess",
        accessorKey: "account.role",
        header: "Admin",
        enableSorting: true,
        meta: {
          tooltip:
            "Admin (Full Access). Full access to the entire system. Can create, update, and delete members, vendors, users, transactions, and adjustments. Can manage role assignments and reset passwords. Includes Read and Write permissions.",
          align: "center",
        },
        cell: ({ row }) => {
          const member = row.original;
          const memberState = memberAccessState[member.account.id];
          const currentRead = memberState?.read ?? member.account.readAccess;
          const currentWrite = memberState?.write ?? member.account.writeAccess;
          const currentAdmin =
            memberState?.admin ?? member.account.role === "ADMIN";

          if (!isAdmin) {
            return (
              <div className="flex items-center justify-center">
                <span
                  className={`text-xs font-medium ${
                    currentAdmin
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentAdmin ? "Yes" : "No"}
                </span>
              </div>
            );
          }

          return (
            <SmartAccessToggle
              memberId={member.account.id}
              memberName={member.name}
              currentRead={currentRead}
              currentWrite={currentWrite}
              currentAdmin={currentAdmin}
              accessType="admin"
              onStateChange={(newState) => {
                setMemberAccessState((prev) => ({
                  ...prev,
                  [member.account.id]: newState,
                }));
              }}
            />
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: {
          tooltip: "Member actions.",
        },
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <RowActionsMenu
                onEdit={
                  canManageAccounts ? () => handleEditMember(member) : undefined
                }
                onAdjustOffset={
                  canManageAccounts
                    ? () => handleAdjustments(member)
                    : undefined
                }
                onResetPassword={
                  isAdmin ? () => handleResetPassword(member) : undefined
                }
              />
            </div>
          );
        },
      },
    ],
    [
      isAdmin,
      memberAccessState,
      canManageAccounts,
      handleEditMember,
      handleAdjustments,
      handleResetPassword,
    ]
  );

  const members = membersData?.members || [];
  const vendors = vendorsData?.vendors || [];

  // Vendor Management Table Columns
  const vendorColumns: ColumnDef<TransformedVendor>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        enableSorting: true,
        meta: {
          tooltip: "Vendor name and code.",
        },
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex items-center gap-3">
              <ClickableAvatar
                src={vendor.avatar}
                alt={vendor.name}
                name={vendor.name}
                href={`/dashboard/vendor`}
                size="md"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary text-xs font-medium"
                  >
                    {vendor.id}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    {vendor.name}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "active",
        header: "Status",
        enableSorting: true,
        meta: {
          tooltip: "Vendor status (Active/Inactive).",
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
        header: "",
        enableSorting: false,
        meta: {
          tooltip: "Vendor actions.",
        },
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <RowActionsMenu
                onEdit={
                  canManageAccounts ? () => handleEditVendor(vendor) : undefined
                }
              />
            </div>
          );
        },
      },
    ],
    [canManageAccounts, handleEditVendor]
  );

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
              <CardTitle>Member & Access Management</CardTitle>
              <CardDescription>
                Admin-only controls to manage members, access, and login.
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                Write access is restricted to creating and updating transactions
                only. It does not provide permissions to modify users, vendors,
                members, or system configurations.
              </p>
            </div>
            {canManageAccounts && (
              <Button onClick={handleAddMember} size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <DataTable
              columns={memberColumns}
              data={members}
              frozenColumnKey="member"
              isLoading={membersLoading}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {membersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-3">
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                      <div className="space-y-2">
                        <div className="h-8 w-full bg-muted animate-pulse rounded" />
                        <div className="h-8 w-full bg-muted animate-pulse rounded" />
                        <div className="h-8 w-full bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length > 0 ? (
              members.map((member) => {
                const memberState = memberAccessState[member.account.id];
                return (
                  <MemberPermissionCard
                    key={member.account.id}
                    member={member}
                    memberAccessState={memberState}
                    isAdmin={isAdmin}
                    onStateChange={(newState) => {
                      setMemberAccessState((prev) => ({
                        ...prev,
                        [member.account.id]: newState,
                      }));
                    }}
                    onEdit={
                      canManageAccounts
                        ? () => handleEditMember(member)
                        : undefined
                    }
                    onAdjustOffset={
                      canManageAccounts
                        ? () => handleAdjustments(member)
                        : undefined
                    }
                    onResetPassword={
                      isAdmin ? () => handleResetPassword(member) : undefined
                    }
                  />
                );
              })
            ) : (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                No members found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Management Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Admin-only controls to add, edit, or manage vendors
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={handleAddVendor} size="sm" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Add Vendor
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={vendorColumns}
            data={vendors}
            frozenColumnKey="name"
            isLoading={vendorsLoading}
          />
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
          <DialogFooter className="gap-2">
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
          <DialogFooter className="gap-2">
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

      {/* Vendor Form Dialog */}
      <VendorFormDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
        selected={selectedVendor}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Member Adjustments Dialog */}
      {selectedMemberForAdjustments && (
        <MemberAdjustmentsDialog
          open={adjustmentsDialogOpen}
          onOpenChange={setAdjustmentsDialogOpen}
          memberId={selectedMemberForAdjustments.account.id}
          memberName={`${selectedMemberForAdjustments.account.firstName} ${selectedMemberForAdjustments.account.lastName || ""}`.trim()}
          passbookId={selectedMemberForAdjustments.account.passbookId || ""}
          currentLateJoin={
            selectedMemberForAdjustments.account.joiningOffset || 0
          }
          currentDelayedPayment={
            selectedMemberForAdjustments.account.delayOffset || 0
          }
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) {
            setNewPassword(null);
            setSelectedMemberForPasswordReset(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newPassword
                ? "Password Reset Successfully"
                : `Reset Password for ${selectedMemberForPasswordReset?.name || "Member"}?`}
            </DialogTitle>
            <DialogDescription>
              {newPassword
                ? "The new password has been generated. Share it securely with the member. This password will not be shown again."
                : "This will generate a new password and invalidate the old one. Share it securely with the member."}
            </DialogDescription>
          </DialogHeader>
          {newPassword ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border bg-muted px-4 py-3 text-sm font-mono">
                  {newPassword}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    toast.success("Password copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setResetPasswordDialogOpen(false);
                    setNewPassword(null);
                    setSelectedMemberForPasswordReset(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmResetPassword}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending
                  ? "Resetting..."
                  : "Reset Password"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
