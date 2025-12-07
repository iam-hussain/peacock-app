"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  FolderSync,
  Loader2,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "react-use";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { CustomLink } from "../ui/link";
import { ScrollArea } from "../ui/scroll-area";

import fetcher from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { moneyFormat } from "@/lib/utils";

interface SearchResult {
  members: Array<{
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    link: string;
    active: boolean;
  }>;
  vendors: Array<{
    id: string;
    name: string;
    avatar?: string;
    active: boolean;
  }>;
  loans: Array<{
    id: string;
    name: string;
    avatar?: string;
    link: string;
    active: boolean;
  }>;
  transactions: Array<{
    id: string;
    fromName: string;
    toName: string;
    amount: number;
    transactionType: string;
    transactionAt: number;
  }>;
}

interface GlobalSearchProps {
  className?: string;
  onResultClick?: () => void;
  isMobile?: boolean;
}

export function GlobalSearch({
  className,
  onResultClick,
  isMobile = false,
}: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useDebounce(
    () => {
      setDebouncedQuery(searchQuery);
    },
    300,
    [searchQuery]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () =>
      fetcher.post("/api/search", {
        searchQuery: debouncedQuery,
      }) as Promise<SearchResult>,
    enabled: debouncedQuery.length >= 2,
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = useMemo(() => {
    if (!data) return false;
    return (
      data.members.length > 0 ||
      data.vendors.length > 0 ||
      data.loans.length > 0 ||
      data.transactions.length > 0
    );
  }, [data]);
  const handleResultClick = () => {
    setIsOpen(false);
    setSearchQuery("");
    if (onResultClick) {
      onResultClick();
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search members, loans, vendors..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "pl-9 pr-9 h-9 text-sm border-border/50 focus-visible:ring-1",
            isMobile ? "bg-muted" : "bg-muted/50"
          )}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border/50 rounded-lg shadow-lg max-h-[500px] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasResults ? (
            <ScrollArea className="max-h-[500px]">
              <div className="p-2">
                {/* Members */}
                {data?.members && data.members.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Members ({data.members.length})</span>
                    </div>
                    {data.members.map((member) => (
                      <CustomLink
                        key={member.id}
                        href={member.link}
                        variant="ghost"
                        size="auto"
                        className="w-full justify-start gap-3 px-3 py-2 rounded-lg hover:bg-accent"
                        onClick={handleResultClick}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </CustomLink>
                    ))}
                  </div>
                )}

                {/* Vendors */}
                {data?.vendors && data.vendors.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Briefcase className="h-3 w-3" />
                      <span>Vendors ({data.vendors.length})</span>
                    </div>
                    {data.vendors.map((vendor) => (
                      <CustomLink
                        key={vendor.id}
                        href={`/dashboard/vendor`}
                        variant="ghost"
                        size="auto"
                        className="w-full justify-start gap-3 px-3 py-2 rounded-lg hover:bg-accent"
                        onClick={handleResultClick}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={vendor.avatar} alt={vendor.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {vendor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {vendor.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vendor.active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </CustomLink>
                    ))}
                  </div>
                )}

                {/* Loans */}
                {data?.loans && data.loans.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <FolderSync className="h-3 w-3" />
                      <span>Loans ({data.loans.length})</span>
                    </div>
                    {data.loans.map((loan) => (
                      <CustomLink
                        key={loan.id}
                        href={loan.link}
                        variant="ghost"
                        size="auto"
                        className="w-full justify-start gap-3 px-3 py-2 rounded-lg hover:bg-accent"
                        onClick={handleResultClick}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={loan.avatar} alt={loan.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {loan.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {loan.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Loan Account
                          </p>
                        </div>
                      </CustomLink>
                    ))}
                  </div>
                )}

                {/* Transactions */}
                {data?.transactions && data.transactions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      <span>Transactions ({data.transactions.length})</span>
                    </div>
                    {data.transactions.map((tx) => (
                      <CustomLink
                        key={tx.id}
                        href="/dashboard/transaction"
                        variant="ghost"
                        size="auto"
                        className="w-full justify-start gap-3 px-3 py-2 rounded-lg hover:bg-accent"
                        onClick={handleResultClick}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {tx.fromName} → {tx.toName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {moneyFormat(tx.amount)} • {tx.transactionType}
                          </p>
                        </div>
                      </CustomLink>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : debouncedQuery.length >= 2 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{debouncedQuery}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
