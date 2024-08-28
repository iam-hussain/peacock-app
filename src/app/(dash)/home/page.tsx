"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

// Dashboard page
export default function HomePage() {
    const [statistics, setStatistics] = useState(null);
    const [transactions, setTransactions] = useState([]);

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

    return (
        <div className="p-6 space-y-8">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard title="Members / Months" value={statistics.membersPerMonth} />
                <DashboardCard title="Members Deposit" value={`₹${statistics.membersDeposit.toLocaleString("en-IN")}`} />
                <DashboardCard title="Members Balance" value={`₹${statistics.membersBalance.toLocaleString("en-IN")}`} />
                <DashboardCard title="Net Members Amount" value={`₹${statistics.netMembersAmount.toLocaleString("en-IN")}`} />
                <DashboardCard title="Net Profit" value={`₹${statistics.netProfit.toLocaleString("en-IN")}`} />
                <DashboardCard title="Net Value Per Member" value={`₹${statistics.netValuePerMember.toLocaleString("en-IN")}`} />
                <DashboardCard title="Net Liquidity" value={`₹${statistics.netLiquidity.toLocaleString("en-IN")}`} />
                <DashboardCard title="Club Net Value" value={`₹${statistics.clubNetValue.toLocaleString("en-IN")}`} />
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium">Recent Transactions</h2>
                <RecentTransactionsTable transactions={transactions} />
            </div>
        </div>
    );
}

// DashboardCard Component
function DashboardCard({ title, value }) {
    return (
        <Card className="shadow-md">
            <CardContent className="p-6">
                <h3 className="text-sm text-gray-500">{title}</h3>
                <p className="text-xl font-bold">{value}</p>
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
                            <TableCell>{`₹${transaction.amount.toLocaleString("en-IN")}`}</TableCell>
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
