"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { BsDatabaseFillCheck } from "react-icons/bs";
import { FaDownload } from "react-icons/fa";
import { FaCalculator } from "react-icons/fa";
import { toast } from "sonner";

import { Button } from "../ui/button";

import { fileDateTime } from "@/lib/core/date";
import fetcher from "@/lib/core/fetcher";
import { cn } from "@/lib/ui/utils";

const ActionMenu = () => {
  const queryClient = useQueryClient();
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const backupMutation = useMutation({
    mutationFn: () => fetcher.post("/api/admin/backup"),
    onSuccess: async (data: any) => {
      // Assuming the response contains the JSON file as a buffer
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob); // Create a downloadable link
      setDownloadLink(downloadUrl); // Set download link
      toast.success("Data backup done successfully, download now.");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const returnsMutation = useMutation({
    mutationFn: () => fetcher.post("/api/admin/recalculate"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all"] });

      toast.success("Returns are recalculated successfully.");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  async function handleBackup(e: React.FormEvent) {
    e.preventDefault();
    return await backupMutation.mutateAsync();
  }

  async function handleReturns(e: React.FormEvent) {
    e.preventDefault();
    return await returnsMutation.mutateAsync();
  }

  return (
    <>
      <Button
        variant={"menu"}
        onClick={handleReturns}
        disabled={backupMutation.isPending || returnsMutation.isPending}
      >
        <FaCalculator className="h-5 w-5" />{" "}
        {returnsMutation.isPending ? "Returns ..." : "Recalculated Returns"}
      </Button>
      <Button
        variant={"menu"}
        onClick={handleBackup}
        disabled={backupMutation.isPending || returnsMutation.isPending}
      >
        <BsDatabaseFillCheck className="h-5 w-5" />{" "}
        {backupMutation.isPending ? "Backing up..." : "Backup Data"}
      </Button>

      {!backupMutation.isPending && downloadLink ? (
        <a
          href={downloadLink}
          download={`peacock_backup_${fileDateTime()}.json`}
          className={cn(
            "h-9 px-4 py-2 inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 no-touch:hover:bg-accent no-touch:hover:text-accent-foreground justify-start gap-4 text-foreground/80 w-full"
          )}
        >
          <FaDownload className="h-5 w-5" />
          Download Backup
        </a>
      ) : (
        <></>
      )}
    </>
  );
};

export default ActionMenu;
