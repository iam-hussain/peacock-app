"use client";
import { Dialog } from "@radix-ui/react-dialog";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import LoanTable from "../organisms/tables/loan-table";
import { Card, CardContent, CardHeader } from "../ui/card";

import { TransformedLoan } from "@/app/api/loan/route";
import { dateFormat } from "@/lib/date";
import { moneyFormat } from "@/lib/utils";

const LoanAction = () => {
  const [selected, setSelected] = useState<null | TransformedLoan["vendor"]>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedLoan) => {
    setSelected(select);
    setIsOpen(true);
  };

  const details = selected?.details || [];
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <LoanTable handleAction={handleAction} />
      <GenericModal title={selected?.name || ""} description={"Loan Details"}>
        <div className="flex gap-4 flex-col">
          {details.map((item: any, index: any) => (
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
                    {moneyFormat(item.interestAmount)}
                  </div>
                  {item.investDate && (
                    <div className="flex justify-between text-sm border-b">
                      <strong className="text-sm text-foreground/80">
                        Invest Date:
                      </strong>{" "}
                      {dateFormat(new Date(item.investDate))}
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      Start Date:
                    </strong>{" "}
                    {dateFormat(new Date(item.startDate))}
                  </div>
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      End Date:
                    </strong>{" "}
                    {item.endDate
                      ? dateFormat(new Date(item.endDate))
                      : "Ongoing"}
                  </div>
                  <div className="flex justify-between text-sm border-b">
                    <strong className="text-sm text-foreground/80">
                      Months Passed:
                    </strong>{" "}
                    {item.monthsPassed}
                  </div>
                  <div className="flex justify-between text-sm">
                    <strong className="text-sm text-foreground/80">
                      Days Passed:
                    </strong>{" "}
                    {item.daysPassed}
                  </div>
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
