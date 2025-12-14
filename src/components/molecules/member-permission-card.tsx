"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SmartAccessToggle } from "@/components/molecules/smart-access-toggle";
import { Separator } from "@/components/ui/separator";
import { moneyFormat } from "@/lib/ui/utils";
import { TransformedMember } from "@/transformers/account";

interface MemberPermissionCardProps {
  member: TransformedMember;
  memberAccessState?: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  isAdmin: boolean;
  onStateChange: (newState: {
    read: boolean;
    write: boolean;
    admin: boolean;
  }) => void;
  onEdit?: () => void;
  onAdjustOffset?: () => void;
  onResetPassword?: () => void;
}

export function MemberPermissionCard({
  member,
  memberAccessState,
  isAdmin,
  onStateChange,
  onEdit,
  onAdjustOffset,
  onResetPassword,
}: MemberPermissionCardProps) {
  const currentRead =
    memberAccessState?.read ??
    ["READ", "WRITE", "ADMIN"].includes(member.account.accessLevel);
  const currentWrite =
    memberAccessState?.write ??
    ["WRITE", "ADMIN"].includes(member.account.accessLevel);
  const currentAdmin =
    memberAccessState?.admin ?? member.account.role === "ADMIN";

  // Determine if user can login (any permission ON)
  const canLogin = currentRead || currentWrite || currentAdmin;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Member Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ClickableAvatar
            src={member.avatar}
            alt={member.name}
            name={member.name}
            href={member.link}
            size="md"
          />
          <div className="flex-1 min-w-0">
            {/* Name with Status Dot */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {member.name}
              </span>
              <div
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  member.active ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />
            </div>
            {/* Status and Login Access - Horizontally Aligned */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {member.active ? "Active" : "Inactive"}
              </span>
              {canLogin ? (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="h-2.5 w-2.5 text-green-600 dark:text-green-500" />
                  <span>Can Login</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <XCircle className="h-2.5 w-2.5" />
                  <span>No Login Access</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {(onEdit || onAdjustOffset || onResetPassword) && (
          <RowActionsMenu
            onEdit={onEdit}
            onAdjustOffset={onAdjustOffset}
            onResetPassword={onResetPassword}
          />
        )}
      </div>

      {/* Managed Funds - Tighter Block */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5 font-medium leading-tight">
          Managed Funds
        </div>
        <div className="text-sm font-medium text-foreground leading-tight">
          {moneyFormat(member.clubHeldAmount || 0)}
        </div>
      </div>

      {/* Divider - Lighter with Adjusted Margins */}
      <Separator className="my-2 opacity-25" />

      {/* Permissions Section - Clean and Structured */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Permissions
        </div>

        <div className="space-y-2">
          {/* First Row: READ */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">READ</span>
            <div className="flex items-center">
              {isAdmin ? (
                <SmartAccessToggle
                  memberId={member.account.id}
                  memberName={member.name}
                  currentRead={currentRead}
                  currentWrite={currentWrite}
                  currentAdmin={currentAdmin}
                  accessType="read"
                  onStateChange={onStateChange}
                />
              ) : (
                <span
                  className={`text-xs font-medium ${
                    currentRead
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentRead ? "Yes" : "No"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between flex-1">
            <span className="text-xs font-medium text-foreground">WRITE</span>
            <div className="flex items-center">
              {isAdmin ? (
                <SmartAccessToggle
                  memberId={member.account.id}
                  memberName={member.name}
                  currentRead={currentRead}
                  currentWrite={currentWrite}
                  currentAdmin={currentAdmin}
                  accessType="write"
                  onStateChange={onStateChange}
                />
              ) : (
                <span
                  className={`text-xs font-medium ${
                    currentWrite
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentWrite ? "Yes" : "No"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between flex-1">
            <span className="text-xs font-medium text-foreground">ADMIN</span>
            <div className="flex items-center">
              {isAdmin ? (
                <SmartAccessToggle
                  memberId={member.account.id}
                  memberName={member.name}
                  currentRead={currentRead}
                  currentWrite={currentWrite}
                  currentAdmin={currentAdmin}
                  accessType="admin"
                  onStateChange={onStateChange}
                />
              ) : (
                <span
                  className={`text-xs font-medium ${
                    currentAdmin
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentAdmin ? "Yes" : "No"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
