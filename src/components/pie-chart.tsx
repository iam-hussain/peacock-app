import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

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
                label: "Funds Distribution",
                data: [available, invested, pending],
                backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
                hoverOffset: 4,
            },
        ],
    };

    return (
        <div className="bg-background rounded-lg w-full px-4 py-4 shadow-sm">
            <h2 className="text-lg font-medium font-serif text-center">Flow Overview</h2>
            <div className="mx-auto w-4/5 md:w-[350px] bg-background flex justify-center align-middle items-center">
                <Pie data={chartData} />
            </div>
        </div>)
}
