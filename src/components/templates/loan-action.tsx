"use client";
import { Dialog } from "@radix-ui/react-dialog";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import LoanTable from "../organisms/tables/loan-table";
import { Card, CardContent, CardHeader } from "../ui/card";

import { dateFormat } from "@/lib/date";
import { LoanHistoryEntry } from "@/lib/type";
import { moneyFormat } from "@/lib/utils";
import { TransformedLoan } from "@/transformers/account";

const LoanAction = () => {
  const [selected, setSelected] = useState<null | TransformedLoan>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedLoan) => {
    setSelected(select);
    setIsOpen(true);
  };

  const details = (selected?.loanHistory ||
    []) as unknown as LoanHistoryEntry[];

  const {
    totalLoanTaken = 0,
    totalLoanRepay = 0,
    totalLoanBalance = 0,
    totalInterestPaid = 0,
    totalInterestAmount = 0,
    totalInterestBalance = 0,
  } = selected || {};

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <LoanTable handleAction={handleAction} />
      <GenericModal title={selected?.name || ""} description={"Loan Details"}>
        <div className="flex flex-col w-full gap-2 pb-8">
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Total Loan Taken:
            </strong>{" "}
            {moneyFormat(totalLoanTaken)}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Total Loan Repay:
            </strong>{" "}
            {moneyFormat(totalLoanRepay || 0)}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Current Loan Amount:
            </strong>{" "}
            {moneyFormat(totalLoanBalance || 0)}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Total Interest Amount:
            </strong>{" "}
            {moneyFormat(totalInterestAmount || 0)}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Interest Paid Amount:
            </strong>{" "}
            {moneyFormat(totalInterestPaid || 0)}
          </div>
          <div className="flex justify-between text-sm">
            <strong className="text-sm text-foreground/80">
              Interest Balance Amount:
            </strong>{" "}
            {moneyFormat(totalInterestBalance || 0)}
          </div>
        </div>
        <div className="flex gap-4 flex-col">
          {details.map((item, index) => (
            <Card key={index} className={"border rounded-md"}>
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
                    <strong className="text-sm text-foreground/80">
                      Amount:
                    </strong>{" "}
                    {moneyFormat(item.amount)}
                  </div>
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      Interest Amount:
                    </strong>{" "}
                    {moneyFormat(item.interestAmount || 0)}
                  </div>
                  {/* {item.startDate && (
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/80">
                        Invest Date:
                      </strong>{" "}
                      {dateFormat(
                        new Date(item.recentLoanTakenDate || new Date())
                      )}
                    </div>
                  )} */}
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      Start Date:
                    </strong>{" "}
                    {dateFormat(new Date(item.startDate))}
                  </div>
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      End Date:
                    </strong>
                    {item.active ? "(Ongoing) - " : ""}
                    {dateFormat(new Date(item.endDate || new Date()))}
                  </div>
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      Months Passed:
                    </strong>{" "}
                    {item.monthsPassed} Months
                  </div>
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      Days Passed:
                    </strong>{" "}
                    {item.daysPassed} of {item.daysInMonth} days
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <strong className="text-sm text-foreground/80">
                      Per Day interest:
                    </strong>{" "}
                    {moneyFormat(item.interestPerDay || 0)}
                  </div> */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </GenericModal>
    </Dialog>
  );
};

export default LoanAction;
