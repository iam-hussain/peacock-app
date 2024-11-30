"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { AvatarGroup } from "@/components/atoms/avatar-group";
import Box from "@/components/ui/box";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { dateFormat } from "@/lib/date";
import { fetchMemberBySlug } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

export default function EachMember({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const captureRef = useRef<HTMLDivElement>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const { data, isLoading, isError } = useQuery(fetchMemberBySlug(slug));

  const member = data?.member;

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
    <Box preset={"stack-start"}>
      {/* <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          {member.name}
        </Typography>
      </Box> */}
      <Box
        preset={"stack-start"}
        className="bg-background p-4 md:p-6 rounded-md width-avl"
      >
        <div className="max-w-2xl mx-auto w-full flex flex-col justify-start align-middle items-center gap-6">
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
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Offset Amount:
              </strong>{" "}
              {moneyFormat(member.totalOffsetAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Offset Deposit:
              </strong>{" "}
              {moneyFormat(member.offsetDepositAmount || 0)}
            </div>
            <div className="flex justify-between text-sm border-b">
              <strong className="text-sm text-foreground/70 font-medium">
                Offset Balance:
              </strong>{" "}
              {moneyFormat(member.totalOffsetBalanceAmount || 0)}
            </div>
            <div className="flex justify-between text-sm">
              <strong className="text-sm text-foreground/70 font-medium">
                Total Balance:
              </strong>{" "}
              {moneyFormat(member.totalBalanceAmount || 0)}
            </div>
          </div>

          <h1>Loan</h1>
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
                        Interest Amount:
                      </strong>{" "}
                      {moneyFormat(item.interestAmount || 0)}
                    </div>
                    {/* {item.startDate && (
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Invest Date:
                      </strong>{" "}
                      {dateFormat(
                        new Date(item.recentLoanTakenDate || new Date())
                      )}
                    </div>
                  )} */}
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
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/70 font-medium">
                        Days Passed:
                      </strong>{" "}
                      {item.daysPassed} of {item.daysInMonth} days
                    </div>
                    {/* <div className="flex justify-between text-sm">
                    <strong className="text-sm text-foreground/70 font-medium">
                      Per Day interest:
                    </strong>{" "}
                    {moneyFormat(item.interestPerDay || 0)}
                  </div> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Box>
    </Box>
  );
}
