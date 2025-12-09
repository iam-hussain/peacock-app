"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ClickableAvatar } from "../atoms/clickable-avatar";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { CustomLink } from "../ui/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { MemberDash } from "./member-dash";
import { MemberDetails } from "./member-details";

import { TransformedMemberStat } from "@/app/api/statistics/route";
import { fetchMemberByUsername, fetchMembers } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";
import { TransformedMember } from "@/transformers/account";

interface MembersPreviewProps {
  initialMembers?: (TransformedMember | TransformedMemberStat)[];
}

export function MembersPreview({ initialMembers = [] }: MembersPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMemberSlug, setSelectedMemberSlug] = useState<string | null>(
    null
  );

  const { data } = useQuery(fetchMembers());
  const members = data?.members || initialMembers;

  const { data: selectedMemberData } = useQuery({
    ...fetchMemberByUsername(selectedMemberSlug || ""),
    enabled: !!selectedMemberSlug,
  });

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter((m) => m.active);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((m) => !m.active);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.username.toLowerCase().includes(query)
      );
    }

    // Return all filtered members
    return filtered;
  }, [members, filterStatus, searchQuery]);

  const handleMemberClick = (username: string) => {
    setSelectedMemberSlug(username);
  };

  const handleCloseDrawer = () => {
    setSelectedMemberSlug(null);
  };

  return (
    <>
      <Card className="rounded-xl border-border/50 bg-card shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-end">
            <CustomLink
              href="/dashboard/member"
              variant="link"
              size="none"
              className="text-sm font-medium"
            >
              View all →
            </CustomLink>
          </div>
          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members Grid */}
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredMembers.map((member) => (
                <button
                  key={member.username}
                  onClick={() => handleMemberClick(member.username)}
                  className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <ClickableAvatar
                    src={member.avatar}
                    alt={member.name}
                    name={member.name}
                    href={member.link}
                    size="lg"
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground line-clamp-1">
                      {member.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {member.active ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </p>
                    {"totalDepositAmount" in member &&
                      member.totalDepositAmount > 0 && (
                        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                          {moneyFormat(member.totalDepositAmount)}
                        </p>
                      )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No members found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Detail Drawer */}
      {selectedMemberData && selectedMemberData.member && (
        <Dialog open={!!selectedMemberSlug} onOpenChange={handleCloseDrawer}>
          <DialogContent className="max-h-[90vh] top-0 right-0 left-auto translate-x-0 translate-y-0 w-full sm:w-[450px] rounded-l-xl rounded-r-none data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] pr-2">
              <div className="space-y-6">
                <MemberDetails
                  member={selectedMemberData.member}
                  captureMode={false}
                />
                <MemberDash member={selectedMemberData.member} />
                <div className="flex justify-end pb-4">
                  <CustomLink
                    href={selectedMemberData.member.link}
                    variant="link"
                    size="none"
                    className="text-sm font-medium"
                  >
                    View full profile →
                  </CustomLink>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
