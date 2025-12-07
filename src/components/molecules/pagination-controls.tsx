"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  showPageSize?: boolean;
  scrollToTop?: boolean;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  showPageSize = true,
  scrollToTop = true,
  className,
}: PaginationControlsProps) {
  const paginationRef = useRef<HTMLDivElement>(null);

  // Scroll to top on page change
  useEffect(() => {
    if (scrollToTop && currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, scrollToTop]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.closest('[data-pagination="true"]') ||
        document.activeElement?.tagName === "BUTTON"
      ) {
        if (e.key === "ArrowLeft" && currentPage > 1) {
          e.preventDefault();
          onPageChange(currentPage - 1);
        } else if (e.key === "ArrowRight" && currentPage < totalPages) {
          e.preventDefault();
          onPageChange(currentPage + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  // Calculate page range for display
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5; // Show up to 5 page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const canGoPrevious = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < totalPages && !isLoading;

  return (
    <div
      ref={paginationRef}
      data-pagination="true"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm",
        className
      )}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
        {/* Left: Pagination Buttons */}
        <div className="flex items-center gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className="h-9 w-9 p-0"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className="h-9 w-9 p-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Info */}
          <div className="px-3 text-sm text-muted-foreground">
            {currentPage} of {totalPages}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            className="h-9 w-9 p-0"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="h-9 w-9 p-0"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Item Count & Page Size */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {totalItems.toLocaleString()}{" "}
            transactions
          </div>
          {showPageSize && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size-select"
                className="text-sm text-muted-foreground"
              >
                Per page:
              </label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="page-size-select"
                  className="h-9 w-[100px] text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Pagination Buttons - Centered */}
        <div className="flex items-center justify-center gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className="h-9 w-9 p-0"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className="h-9 w-9 p-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Current Page Info */}
          <div className="px-3 text-sm font-medium text-foreground">
            {currentPage} of {totalPages}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            className="h-9 w-9 p-0"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="h-9 w-9 p-0"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Item Count & Page Size - Below */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Showing {startItem}–{endItem} of {totalItems.toLocaleString()}{" "}
            transactions
          </div>
          {showPageSize && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size-select-mobile"
                className="text-xs text-muted-foreground"
              >
                Per page:
              </label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="page-size-select-mobile"
                  className="h-9 w-[100px] text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
