import { LoanHistoryEntry } from "@/lib/type";
import { Card, CardContent, CardHeader } from "../ui/card";
import { cn, moneyFormat } from "@/lib/utils";
import { dateFormat } from "@/lib/date";

export function LoanHistory({
  loanHistory,
  captureMode = false,
}: {
  loanHistory: LoanHistoryEntry[];
  captureMode: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-between align-middle items-center w-full">
      {loanHistory.map((item, index) => (
        <Card
          key={index}
          className={"border rounded-md w-full md:w-auto min-w-[300px]"}
        >
          <CardHeader className="flex flex-col">
            <div className="flex justify-between w-full align-bottom items-center">
              <div>Transaction #{index + 1}</div>
              <div
                className={`text-sm ${item.active ? "text-green-600" : "text-gray-500"}`}
              >
                {item.active ? "Active" : "Inactive"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col w-full gap-2">
              <div
                className={cn("flex justify-between text-sm", {
                  "border-b": !captureMode,
                })}
              >
                <strong className="text-sm text-foreground/70 font-medium">
                  Amount:
                </strong>{" "}
                {moneyFormat(item.amount)}
              </div>
              <div
                className={cn("flex justify-between text-sm", {
                  "border-b": !captureMode,
                })}
              >
                <strong className="text-sm text-foreground/70 font-medium">
                  Interest Rate:
                </strong>{" "}
                1%
              </div>
              <div
                className={cn("flex justify-between text-sm", {
                  "border-b": !captureMode,
                })}
              >
                <strong className="text-sm text-foreground/70 font-medium">
                  Interest Amount:
                </strong>{" "}
                {moneyFormat(item.interestAmount || 0)}
              </div>
              <div
                className={cn("flex justify-between text-sm", {
                  "border-b": !captureMode,
                })}
              >
                <strong className="text-sm text-foreground/70 font-medium">
                  Start Date:
                </strong>{" "}
                {dateFormat(new Date(item.startDate))}
              </div>
              <div
                className={cn("flex justify-between text-sm", {
                  "border-b": !captureMode,
                })}
              >
                <strong className="text-sm text-foreground/70 font-medium">
                  End Date:
                </strong>
                {item.active ? "(Ongoing) - " : ""}
                {dateFormat(new Date(item.endDate || new Date()))}
              </div>
              <div
                className={cn("flex justify-between text-sm", {
                  "border-b": !captureMode,
                })}
              >
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
  );
}
