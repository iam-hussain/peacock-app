"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card } from "../ui/card";

// Register necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

type PieChartProps = {
  available: number;
  invested: number;
  pending: number;
};

export function PieChart({ available, invested, pending }: PieChartProps) {
  const chartData = {
    labels: ["Available", "Invested", "Pending"],
    datasets: [
      {
        data: [available, invested, pending],
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Card className="shadow-sm flex items-center rounded-lg p-4 flex-col">
      <h2 className="text-lg font-medium text-center">
        Flow Overview
      </h2>
      <div className="mx-auto w-4/5 md:w-[350px] bg-background flex justify-center align-middle items-center">
        <Pie data={chartData} />
      </div>
    </Card>
  );
}
