"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { FaUsers, FaMoneyBillWave, FaBalanceScale, FaChartLine, FaPiggyBank } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { PieChart } from "@/components/pie-chart";
import { DoughnutChart } from "@/components/doughnut-chart";
import Typography from "@/components/ui/typography";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function HomePage() {
    const [statistics, setStatistics] = useState<any | null>(null);
    const [transactions, setTransactions] = useState<any[] | null>([]);

    useEffect(() => {
        // Fetch statistics
        fetch("/api/statistics")
            .then((res) => res.json())
            .then((data) => setStatistics(data));

        // Fetch recent transactions
        fetch("/api/transactions")
            .then((res) => res.json())
            .then((data) => setTransactions(data));
    }, []);

    if (!statistics) return <div>Loading...</div>;

    // Chart Data
    const chartData = {
        labels: ["Per Months", "Deposit", "Balance", "Net Profit"],
        datasets: [
            {
                label: "Statistics",
                data: [
                    statistics.membersPerMonth * 2000,
                    statistics.membersDeposit,
                    statistics.membersBalance,
                    statistics.netProfit,
                ],
                backgroundColor: ["#4CAF50", "#FFC107", "#2196F3", "#FF5722"],
            },
        ],
    };

    return (
        <div className="px-6 md:py-6 space-y-8 w-full">
            {/* Statistics Grid with Icons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard
                    title="Members / Months"
                    value={statistics.membersPerMonth}
                    icon={<FaUsers className="text-3xl text-blue-600" />}
                />
                <DashboardCard
                    title="Members Deposit"
                    value={statistics.membersDeposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaMoneyBillWave className="text-3xl text-green-600" />}
                />
                <DashboardCard
                    title="Members Balance"
                    value={statistics.membersBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaBalanceScale className="text-3xl text-yellow-600" />}
                />
                <DashboardCard
                    title="Net Members Amount"
                    value={statistics.netMembersAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaChartLine className="text-3xl text-red-600" />}
                />
                <DashboardCard
                    title="Net Profit"
                    value={statistics.netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaPiggyBank className="text-3xl text-purple-600" />}
                />
                <DashboardCard
                    title="Net Value Per Member"
                    value={statistics.netValuePerMember.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaUsers className="text-3xl text-indigo-600" />}
                />
                <DashboardCard
                    title="Net Liquidity"
                    value={statistics.netLiquidity.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaBalanceScale className="text-3xl text-orange-600" />}
                />
                <DashboardCard
                    title="Club Net Value"
                    value={statistics.clubNetValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaMoneyBillWave className="text-3xl text-teal-600" />}
                />
            </div>
            <div className="flex gap-6 flex-col md:flex-row">
                <PieChart available={30} invested={50} pending={20} />
                <DoughnutChart deposit={100} offset={10} returns={30} />
            </div>


            {/* Recent Transactions */}
            {/* <div className="space-y-4 bg-background p-4 rounded-lg">
                <h2 className="text-lg font-medium">Recent Transactions</h2>
                <RecentTransactionsTable transactions={transactions} />
            </div> */}
        </div>
    );
}

// DashboardCard Component with Icon
function DashboardCard({ title, value, icon }) {
    return (
        <Card className="shadow-sm flex items-center rounded-lg">
            <CardContent className="p-6 flex space-x-4">
                {icon}
                <div>
                    <h3 className="text-sm text-gray-500">{title}</h3>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// RecentTransactionsTable Component
function RecentTransactionsTable({ transactions }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>
                        <Button variant="ghost" size="sm">
                            Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>{transaction.member}</TableCell>
                            <TableCell>{transaction.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                            <TableCell>{transaction.type}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            No transactions found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
