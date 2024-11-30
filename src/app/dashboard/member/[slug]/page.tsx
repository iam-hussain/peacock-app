"use client";

import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import { IoCamera } from "react-icons/io5";

import { AvatarGroup } from "@/components/atoms/avatar-group";
import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { dateFormat, displayDateTime, fileDateTime } from "@/lib/date";
import { fetchMemberBySlug } from "@/lib/query-options";
import { cn, moneyFormat } from "@/lib/utils";
import { DashboardCard } from "@/components/atoms/dashboard-card";
import { Separator } from "@/components/ui/separator";

export default function EachMember({ params }: { params: { slug: string } }) {
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
        <div
          className={cn("absolute top-4 right-4", {
            hidden: captureMode,
          })}
        >
          <Button onClick={onCapture} size="icon" variant={"outline"}>
            <IoCamera className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-w-2xl mx-auto w-full flex flex-col justify-start align-middle items-center gap-6">
          <div
            className={cn(
              "hidden justify-end align-middle items-center flex-col pb-6 gap-2",
              {
                flex: captureMode,
              }
            )}
          >
            <Typography variant={"brandMini"} className="text-4xl">
              Peacock Club
            </Typography>
            <p className="test-sm text-foreground/80">{displayDateTime()}</p>
          </div>

          <Box preset={"row-center"}>
            <AvatarGroup
              className={"p-2"}
              src={member.avatar || ""}
              name={member.name}
              isLarge={true}
            />
            <div>
              <Typography variant={"h4"} className="">
                {member.name}
              </Typography>
              <p className="text-sm text-foreground/70 font-medium">
                {dateFormat(member.startAt)}
              </p>
              {/* <p className="text-sm text-foreground/70 font-medium">
                {member.monthsPassedString}
              </p> */}
            </div>
          </Box>
          <div className={"grid grid-cols-1 md:grid-cols-3 gap-2 w-full"}>
            <DashboardCard
              title="Deposit Balance"
              value={moneyFormat(member.totalBalanceAmount || 0)}
              useRed={member.totalBalanceAmount > 0}
              useGreen={member.totalBalanceAmount < 0}
            />
            <DashboardCard
              title="Loan Amount"
              value={moneyFormat(member.totalLoanBalance || 0)}
              useGreen={member.totalLoanBalance > 0}
            />
            <DashboardCard
              title="Interest Balance"
              value={moneyFormat(member.totalInterestBalance || 0)}
              useRed={member.totalInterestBalance > 0}
              useGreen={member.totalInterestBalance < 0}
            />
          </div>

          <div className="flex flex-col w-full gap-2 pb-8">
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Months Passed:
              </strong>{" "}
              {member.monthsPassedString}
            </div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Monthly Deposit:
              </strong>{" "}
              {moneyFormat(member.periodicDepositAmount || 0)}
            </div>
            <div className="flex justify-between text-sm">
              <strong className="text-sm text-foreground/70 font-medium">
                Deposit Balance:
              </strong>{" "}
              {moneyFormat(member.periodicDepositBalance || 0)}
            </div>
            <div className="py-2"></div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Late Join Offset:
              </strong>{" "}
              {moneyFormat(member.joiningOffset || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Delay Paying Offset:
              </strong>{" "}
              {moneyFormat(member.delayOffset || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Total Offset:
              </strong>{" "}
              {moneyFormat(member.totalOffsetAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Offset Deposit:
              </strong>{" "}
              {moneyFormat(member.offsetDepositAmount || 0)}
            </div>
            <div className="flex justify-between text-sm">
              <strong className="text-sm text-foreground/70 font-medium">
                Offset Balance:
              </strong>{" "}
              {moneyFormat(member.totalOffsetBalanceAmount || 0)}
            </div>
            <div className="py-2"></div>
            <div className="flex justify-between text-sm">
              <strong className="text-sm text-foreground/70 font-medium">
                Total Deposit Balance:
              </strong>{" "}
              {moneyFormat(member.totalBalanceAmount || 0)}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col w-full">
            <h1 className="text-xl text-center w-full">Loan</h1>
            <div className="flex flex-col w-full gap-2 pb-8">
              <div className="flex justify-between text-sm border-b">
                <strong className="text-sm text-foreground/70 font-medium">
                  Total Loan Taken:
                </strong>{" "}
                {moneyFormat(member.totalLoanTaken)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <strong className="text-sm text-foreground/70 font-medium">
                  Total Loan Repay:
                </strong>{" "}
                {moneyFormat(member.totalLoanRepay || 0)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <strong className="text-sm text-foreground/70 font-medium">
                  Current Loan Amount:
                </strong>{" "}
                {moneyFormat(member.totalLoanBalance || 0)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <strong className="text-sm text-foreground/70 font-medium">
                  Total Interest Amount:
                </strong>{" "}
                {moneyFormat(member.totalInterestAmount || 0)}
              </div>
              <div className="flex justify-between text-sm border-b">
                <strong className="text-sm text-foreground/70 font-medium">
                  Interest Paid Amount:
                </strong>{" "}
                {moneyFormat(member.totalInterestPaid || 0)}
              </div>
              <div className="flex justify-between text-sm">
                <strong className="text-sm text-foreground/70 font-medium">
                  Interest Balance Amount:
                </strong>{" "}
                {moneyFormat(member.totalInterestBalance || 0)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-between align-middle items-center w-full">
            {member.loanHistory.map((item, index) => (
              <Card key={index} className={"border rounded-md min-w-[300px]"}>
                <CardHeader className="flex flex-col">
                  <div className="flex justify-between w-full align-bottom items-center">
                    <div>Transaction #{index + 1}</div>{" "}
                    <div
                      className={`text-sm ${item.active ? "text-green-600" : "text-gray-500"}`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="">
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Amount:
                      </strong>{" "}
                      {moneyFormat(item.amount)}
                    </div>

                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Interest Rate:
                      </strong>{" "}
                      1%
                    </div>
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Interest Amount:
                      </strong>{" "}
                      {moneyFormat(item.interestAmount || 0)}
                    </div>
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Start Date:
                      </strong>{" "}
                      {dateFormat(new Date(item.startDate))}
                    </div>
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        End Date:
                      </strong>
                      {item.active ? "(Ongoing) - " : ""}
                      {dateFormat(new Date(item.endDate || new Date()))}
                    </div>
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Months Passed:
                      </strong>{" "}
                      {item.monthsPassed} Months
                    </div>
                    <div className="flex justify-between text-sm">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Days Passed:
                      </strong>{" "}
                      {item.daysPassed} of {item.daysInMonth} days
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
