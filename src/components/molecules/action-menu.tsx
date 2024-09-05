"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { BsDatabaseFillCheck } from "react-icons/bs";
import { FaDownload } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FaCalculator } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import fetcher from "@/lib/fetcher";

const ActionMenu = () => {
  const [downloadLink, setDownloadLink] = useState<string | null>(
    "/peacock_backup.json",
  );

  const backupMutation = useMutation({
    mutationFn: () => fetcher.post("/api/action/backup"),
    onSuccess: async () => {
      toast.success("Data backup done successfully, download now.");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const returnsMutation = useMutation({
    mutationFn: () => fetcher.post("/api/action/returns"),
    onSuccess: async () => {
      toast.success("Returns are recalculated successfully.");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
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
        {returnsMutation.isPending
          ? "Recalculated ..."
          : "Recalculated Returns"}
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
          download="peacock_backup.json"
          className={cn(
            "h-9 px-4 py-2 inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 no-touch:hover:bg-accent no-touch:hover:text-accent-foreground justify-start gap-4 text-foreground/80 w-full",
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
