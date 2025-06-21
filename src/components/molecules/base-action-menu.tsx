"use client";

import { useMutation } from "@tanstack/react-query";
import React from "react";
import { GiCatch } from "react-icons/gi";
import { toast } from "sonner";

import { Button } from "../ui/button";

import fetcher from "@/lib/fetcher";

const BaseActionMenu = () => {
  const catchMutation = useMutation({
    mutationFn: () => fetcher.post("/api/action/catch"),
    onSuccess: async () => {
      toast.success("Catch cleared successfully. ✅");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again. 🚫"
      );
    },
  });

  return (
    <>
      <Button
        variant={"menu"}
        onClick={() => catchMutation.mutate()}
        disabled={catchMutation.isPending || catchMutation.isPending}
      >
        <GiCatch className="h-5 w-5" />{" "}
        {catchMutation.isPending ? "Clearing catch..." : "Clear catch"}
      </Button>
    </>
  );
};

export default BaseActionMenu;
