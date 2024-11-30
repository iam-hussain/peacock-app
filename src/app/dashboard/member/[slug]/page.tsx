"use client";

import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import { IoCamera } from "react-icons/io5";

import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchMemberBySlug } from "@/lib/query-options";
import { cn, moneyFormat } from "@/lib/utils";
import { MemberDash } from "@/components/molecules/member-dash";
import { LoanHistory } from "@/components/molecules/loan-history";
import { MemberDetails } from "@/components/molecules/member-details";
import { fileDateTime } from "@/lib/date";

export default function MemberPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const captureRef = useRef<HTMLDivElement>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const { data, isLoading, isError } = useQuery(fetchMemberBySlug(slug));

  const member = data?.member;

  const onCapture = async () => {
    if (captureRef.current) {
      setCaptureMode(true);
    }
  };

  const handleOnCapture = async () => {
    if (captureRef.current) {
      const canvas = await html2canvas(captureRef.current, {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      });
      setCaptureMode(false);
      const capturedImage = canvas.toDataURL("image/png");
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          `<img src="${capturedImage}" alt="peacock_club_members_${fileDateTime()}" />`
        );
      } else {
        const link = document.createElement("a");
        link.download = `peacock_club_members_${fileDateTime()}.png`;
        link.href = capturedImage;
        link.click();
      }
    }
  };

  useEffect(() => {
    if (captureMode) {
      handleOnCapture();
    }
  }, [captureMode]);

  if (isLoading || !member) {
    return (
      <Box>
        <p className="p-8">Loading...</p>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <p className="p-8 text-center w-full text-destructive">
          Unexpected error on fetching the data
        </p>
      </Box>
    );
  }

  return (
    <div className="flex flex-col justify-start items-start relative w-full h-full">
      <div
        className="flex flex-col justify-start items-start relative w-full h-full bg-background p-4 md:p-6 rounded-md"
        ref={captureRef}
      >
        <div className={cn("absolute top-4 right-4", { hidden: captureMode })}>
          <Button onClick={onCapture} size="icon" variant={"outline"}>
            <IoCamera className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-w-2xl mx-auto w-full flex flex-col justify-start align-middle items-center gap-6">
          <MemberDetails member={member} captureMode={captureMode} />
          <MemberDash member={member} />
          <div className="flex flex-col w-full gap-2 pb-8 border p-4">
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Months Passed:
              </span>
              {member.monthsPassedString}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Monthly Deposit:
              </span>{" "}
              {moneyFormat(member.periodicDepositAmount || 0)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sm text-foreground/70 font-medium">
                Deposit Balance:
              </span>{" "}
              {moneyFormat(member.periodicDepositBalance || 0)}
            </div>
            <div className="py-2"></div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Late Join Offset:
              </span>{" "}
              {moneyFormat(member.joiningOffset || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Delay Paying Offset:
              </span>{" "}
              {moneyFormat(member.delayOffset || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Total Offset:
              </span>{" "}
              {moneyFormat(member.totalOffsetAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Offset Deposit:
              </span>{" "}
              {moneyFormat(member.offsetDepositAmount || 0)}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sm text-foreground/70 font-medium">
                Offset Balance:
              </span>{" "}
              {moneyFormat(member.totalOffsetBalanceAmount || 0)}
            </div>
            <div className="py-2"></div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Total Deposit:
              </span>{" "}
              {moneyFormat(member.totalDepositAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Total Withdrawal:
              </span>{" "}
              {moneyFormat(member.withdrawalAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                Profit Withdrawal:
              </span>{" "}
              {moneyFormat(member.profitWithdrawalAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <span className="text-sm text-foreground/70 font-medium">
                In Account:
              </span>{" "}
              {moneyFormat(member.accountBalance || 0)}
            </div>
            <div className="py-2"></div>
            <div className="flex justify-between text-sm">
              <span className="text-sm text-foreground/70 font-medium">
                Total Deposit Balance:
              </span>{" "}
              {moneyFormat(member.totalBalanceAmount || 0)}
            </div>
          </div>
          <Separator />
          <div className="flex flex-col w-full">
            <h1 className="text-xl text-center w-full">Loan</h1>
            <div className="flex flex-col w-full gap-2 pb-8">
              <div className="flex justify-between text-sm border-b">
                <span className="text-sm text-foreground/70 font-medium">
                  Total Loan Taken:
                </span>{" "}
                {moneyFormat(member.totalLoanTaken)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <span className="text-sm text-foreground/70 font-medium">
                  Total Loan Repay:
                </span>{" "}
                {moneyFormat(member.totalLoanRepay || 0)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <span className="text-sm text-foreground/70 font-medium">
                  Current Loan Amount:
                </span>{" "}
                {moneyFormat(member.totalLoanBalance || 0)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <span className="text-sm text-foreground/70 font-medium">
                  Total Interest Amount:
                </span>{" "}
                {moneyFormat(member.totalInterestAmount || 0)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <span className="text-sm text-foreground/70 font-medium">
                  Interest Paid Amount:
                </span>{" "}
                {moneyFormat(member.totalInterestPaid || 0)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sm text-foreground/70 font-medium">
                  Interest Balance Amount:
                </span>{" "}
                {moneyFormat(member.totalInterestBalance || 0)}
              </div>
            </div>
          </div>
          <LoanHistory loanHistory={member.loanHistory} />
        </div>
      </div>
    </div>
  );
}
