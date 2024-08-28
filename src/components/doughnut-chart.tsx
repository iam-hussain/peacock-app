import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

type DoughnutChartProps = {
    deposit: number;
    offset: number;
    returns: number;
};

export function DoughnutChart({ deposit, offset, returns }: DoughnutChartProps) {
    const chartData = {
        labels: ["Deposit", "Offset", "Returns"],
        datasets: [
            {
                label: "Financial Breakdown",
                data: [deposit, offset, returns],
                backgroundColor: ["#4CAF50", "#FF5722", "#FFC107"],
                hoverOffset: 4,
            },
        ],
    };

    return (
        <div className="bg-background rounded-lg w-full px-4 py-4 shadow-sm">
            <h2 className="text-lg font-medium font-serif text-center">Fund Overview</h2>
            <div className="mx-auto w-4/5 md:w-[350px] bg-background flex justify-center align-middle items-center">
                <Doughnut data={chartData} />
            </div>
        </div>)
}
