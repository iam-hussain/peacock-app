"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SmartAccessToggle } from "@/components/molecules/smart-access-toggle";
import { Separator } from "@/components/ui/separator";
import { moneyFormat } from "@/lib/utils";
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
  const currentRead = memberAccessState?.read ?? member.account.readAccess;
  const currentWrite = memberAccessState?.write ?? member.account.writeAccess;
  const currentAdmin =
    memberAccessState?.admin ?? member.account.role === "ADMIN";

  // Determine if user can login (any permission ON)
  const canLogin = currentRead || currentWrite || currentAdmin;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 min-h-[200px]">
      {/* Member Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ClickableAvatar
            src={member.avatar}
            alt={member.name}
            name={member.name}
            href={member.link}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">
                {member.name}
              </span>
              <div
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  member.active ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {member.active ? "Active" : "Inactive"}
              </span>
              {canLogin ? (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Can Login</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <XCircle className="h-3 w-3" />
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

      {/* Managed Funds */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium">
          Managed Funds
        </div>
        <div className="text-sm font-medium text-foreground">
          {moneyFormat(member.clubHeldAmount || 0)}
        </div>
      </div>

      <Separator className="my-2" />

      {/* Permissions Section */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          Permissions
        </div>

        {/* Top Row: READ on the right */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <span className="text-sm font-medium text-foreground min-w-[56px] text-left">
              READ
            </span>
            <div className="flex items-center justify-center flex-shrink-0">
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
        </div>

        {/* Second Row: WRITE and ADMIN */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-foreground min-w-[56px] text-left">
              WRITE
            </span>
            <div className="flex items-center justify-center flex-shrink-0">
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
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-foreground min-w-[56px] text-left">
              ADMIN
            </span>
            <div className="flex items-center justify-center flex-shrink-0">
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
