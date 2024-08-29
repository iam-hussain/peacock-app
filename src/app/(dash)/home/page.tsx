
import { FaUsers, FaMoneyBillWave, FaBalanceScale, FaChartLine, FaPiggyBank } from "react-icons/fa";
import { PieChart } from "@/components/pie-chart";
import { DoughnutChart } from "@/components/doughnut-chart";
import { getStatistics } from "@/actions/statistics";
import { DashboardCard } from "@/components/composition/dashboard-card";

export default async function HomePage() {
    const statistics = await getStatistics();

    return (
        <div className="px-6 md:py-6 space-y-6 w-full">
            {/* Statistics Grid with Icons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard
                    title="Members / Months"
                    value={`${statistics.membersCount} / ${statistics.totalMonths}`}
                    icon={<FaUsers className="text-3xl text-blue-600" />}
                />
                <DashboardCard
                    title="Net Returns"
                    value={statistics.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaPiggyBank className="text-3xl text-purple-600" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard
                    title="Members Deposit"
                    value={statistics.deposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaMoneyBillWave className="text-3xl text-green-600" />}
                />
                <DashboardCard
                    title="Members Balance"
                    value={statistics.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaBalanceScale className="text-3xl text-yellow-600" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6">

                <DashboardCard
                    title="Offset Deposit"
                    value={statistics.offsetIn.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaPiggyBank className="text-3xl text-purple-600" />}
                />
                <DashboardCard
                    title="Offset Balance"
                    value={statistics.offsetBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaChartLine className="text-3xl text-red-600" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6">

                <DashboardCard
                    title="Offset Value"
                    value={statistics.offset.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaChartLine className="text-3xl text-red-600" />}
                />
                <DashboardCard
                    title="Net Returns"
                    value={statistics.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaPiggyBank className="text-3xl text-purple-600" />}
                />

            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6">

                <DashboardCard
                    title="Liquidity Amount"
                    value={statistics.liquidity.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaBalanceScale className="text-3xl text-orange-600" />}
                />
                <DashboardCard
                    title="Club Net Amount"
                    value={statistics.netAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaMoneyBillWave className="text-3xl text-teal-600" />}
                />
                <DashboardCard
                    title="Member Value"
                    value={statistics.memberValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaUsers className="text-3xl text-indigo-600" />}
                />
                <DashboardCard
                    title="Club Value"
                    value={statistics.netValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    icon={<FaMoneyBillWave className="text-3xl text-teal-600" />}
                />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <PieChart available={statistics.liquidity} invested={statistics.invested} pending={statistics.balance} />
                <DoughnutChart deposit={statistics.deposit} offset={statistics.offset} returns={statistics.returns} />
            </div>

        </div>
    );
}

