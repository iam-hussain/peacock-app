"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { exportScreenshot } from "@/lib/ui/export-screenshot";

interface UseTableExportOptions<TData> {
  tableName: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  filenamePrefix?: string;
  title?: string;
  identifier?: string;
}

/**
 * Reusable hook for table export functionality (CSV and Screenshot)
 *
 * @param options - Configuration options for the export
 * @returns Object containing export handlers and table ref
 */
export function useTableExport<TData>({
  tableName,
  columns,
  data,
  filenamePrefix = "peacock-club",
  title,
  identifier,
}: UseTableExportOptions<TData>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [capturedAt, setCapturedAt] = useState<Date | undefined>(undefined);

  /**
   * Generate filename with timestamp
   */
  const generateFilename = useCallback(
    (extension: string) => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 19).replace(/:/g, "-");
      return `${filenamePrefix}-${tableName}-${dateStr}.${extension}`;
    },
    [filenamePrefix, tableName]
  );

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  const escapeCsvValue = useCallback((value: unknown): string => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (/[,"\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }, []);

  /**
   * Extract header label from column definition
   */
  const getColumnHeader = useCallback((column: ColumnDef<TData>): string => {
    if (typeof column.header === "string") {
      return column.header;
    }

    if (typeof column.header === "function") {
      // Try to get header from meta or accessorKey as fallback
      const meta = column.meta as { tooltip?: string } | undefined;
      if (meta?.tooltip) {
        // Use tooltip as header if available
        return meta.tooltip.split(".")[0]; // Take first sentence
      }

      // Fallback to accessorKey or id
      const accessorKey =
        "accessorKey" in column ? (column.accessorKey as string) : undefined;
      return accessorKey || (column.id as string) || "Column";
    }

    // Fallback
    const accessorKey =
      "accessorKey" in column ? (column.accessorKey as string) : undefined;
    return accessorKey || (column.id as string) || "Column";
  }, []);

  /**
   * Extract cell value from row data
   * Handles nested accessorKeys and falls back to column id
   */
  const getCellValue = useCallback(
    (row: TData, column: ColumnDef<TData>): string => {
      let value: any = undefined;

      // If column has accessorKey, use it (supports nested paths like "user.name")
      const accessorKey =
        "accessorKey" in column ? (column.accessorKey as string) : undefined;
      if (accessorKey) {
        const keys = String(accessorKey).split(".");
        value = row as any;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined || value === null) break;
        }
      } else if (column.id) {
        // Fallback to column id
        value = (row as any)[column.id];
      }

      // Handle different value types
      if (value === null || value === undefined) {
        return "";
      }

      // If value is a number, format it
      if (typeof value === "number") {
        return escapeCsvValue(value);
      }

      // If value is a date, format it
      if (value instanceof Date) {
        return escapeCsvValue(value.toISOString().split("T")[0]);
      }

      // If value is an object with common properties, extract meaningful data
      if (typeof value === "object" && value !== null) {
        // Try common property names
        if ("name" in value) {
          return escapeCsvValue(String(value.name));
        }
        if ("label" in value) {
          return escapeCsvValue(String(value.label));
        }
        if ("value" in value) {
          return escapeCsvValue(String(value.value));
        }
        // Fallback to JSON string
        return escapeCsvValue(JSON.stringify(value));
      }

      return escapeCsvValue(String(value));
    },
    [escapeCsvValue]
  );

  /**
   * Export table data to CSV
   */
  const handleExportCsv = useCallback(() => {
    try {
      // Filter out action columns and non-data columns
      const dataColumns = columns.filter((col) => {
        const header = getColumnHeader(col);
        const isActionColumn =
          header.toLowerCase().includes("action") ||
          col.id === "actions" ||
          col.meta?.tooltip?.toLowerCase().includes("action");

        return !isActionColumn;
      });

      // Build CSV content
      const csvRows: string[] = [];

      // Add headers
      const headers = dataColumns.map((col) =>
        escapeCsvValue(getColumnHeader(col))
      );
      csvRows.push(headers.join(","));

      // Add data rows
      data.forEach((row) => {
        const values = dataColumns.map((col) => getCellValue(row, col));
        csvRows.push(values.join(","));
      });

      // Create CSV blob
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFilename("csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  }, [
    columns,
    data,
    getColumnHeader,
    getCellValue,
    escapeCsvValue,
    generateFilename,
  ]);

  /**
   * Generate filename for screenshot (without extension)
   */
  const generateScreenshotFilename = useCallback(() => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, "-");
    const sanitizedTitle = title
      ? title.toLowerCase().replace(/\s+/g, "-")
      : tableName;
    return `${filenamePrefix}-${sanitizedTitle}-${dateStr}`;
  }, [filenamePrefix, tableName, title]);

  /**
   * Capture and export table as screenshot using branded template
   */
  const handleScreenshot = useCallback(async () => {
    const node = document.getElementById("export-root");
    if (!node) {
      toast.error(
        "ScreenshotArea not found. Please wrap your table in ScreenshotArea component."
      );
      return;
    }

    try {
      // Set captured timestamp right before export
      const now = new Date();
      setCapturedAt(now);

      // Wait a tick to ensure the timestamp is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      toast.loading("Capturing screenshot...", { id: "screenshot" });

      const filename = generateScreenshotFilename();
      await exportScreenshot(filename, {
        pixelRatio: 2,
        quality: 1.0,
      });

      toast.success("Screenshot exported successfully", {
        id: "screenshot",
      });
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast.error("Failed to capture screenshot", { id: "screenshot" });
    }
  }, [generateScreenshotFilename]);

  return {
    handleExportCsv,
    handleScreenshot,
    tableRef,
    capturedAt,
    identifier,
  };
}
