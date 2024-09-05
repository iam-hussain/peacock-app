"use client";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { Card } from "../ui/card";

// Register necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

type DoughnutChartProps = {
  deposit: number;
  offset: number;
  returns: number;
};

export function DoughnutChart({
  deposit,
  offset,
  returns,
}: DoughnutChartProps) {
  const chartData = {
    labels: ["Deposit", "Offset", "Returns"],
    datasets: [
      {
        data: [deposit, offset, returns],
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Card className="shadow-sm flex items-center rounded-lg p-4 flex-col">
      <h2 className="text-lg font-medium text-center">Fund Overview</h2>
      <div className="mx-auto w-4/5 md:w-[350px] bg-background flex justify-center align-middle items-center">
        <Doughnut data={chartData} />
      </div>
    </Card>
  );
}
