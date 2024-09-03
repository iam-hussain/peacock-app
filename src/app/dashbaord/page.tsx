"use client";

import { FaUsers, FaBalanceScale, FaPiggyBank } from "react-icons/fa";
import { GiHandBandage } from "react-icons/gi";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import { GiReceiveMoney } from "react-icons/gi";
import { GiPayMoney } from "react-icons/gi";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { FaScaleUnbalancedFlip } from "react-icons/fa6";

import { PieChart } from "@/components/molecules/pie-chart";
import { DoughnutChart } from "@/components/molecules/doughnut-chart";
import { DashboardCard } from "@/components/atoms/dashboard-card";
import { clubAge } from "@/lib/date";
import Box from "@/components/ui/box";
import { useQuery } from "@tanstack/react-query";
import { fetchStatistics } from "@/lib/query-options";

export default function DashboardPage() {
  const club = clubAge();
  const { data, isLoading, isError } = useQuery(fetchStatistics());
  const statistics = data?.statistics || null;

  if (isLoading) {
    return (
      <Box>
        <p className="p-8">Loading...</p>
      </Box>
    );
  }

  if (isError || !statistics) {
    return (
      <Box>
        <p className="p-8 text-center w-full text-destructive">
          Unexpected error on fetching the data
        </p>
      </Box>
    );
  }

  return (
    <div className="px-6 md:py-6 space-y-6 w-full">
      {/* Statistics Grid with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Members / Months"
          value={`${statistics.membersCount} / ${club.inMonth}`}
          icon={<FaUsers className="text-3xl text-blue-600" />}
        />
        <DashboardCard
          title="Since"
          value={clubAge().since}
          icon={<GiHandBandage className="text-3xl text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Members Deposit"
          value={statistics.deposit.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaPiggyBank className="text-3xl text-green-600" />}
        />
        <DashboardCard
          title="Members Balance"
          value={statistics.balance.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaBalanceScale className="text-3xl text-yellow-600" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6">
        <DashboardCard
          title="Offset Deposit"
          value={statistics.offsetIn.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaPiggyBank className="text-3xl text-purple-600" />}
        />
        <DashboardCard
          title="Offset Balance"
          value={statistics.offsetBalance.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaBalanceScale className="text-3xl text-red-600" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6">
        <DashboardCard
          title="Offset Value"
          value={statistics.offset.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaScaleUnbalancedFlip className="text-3xl text-red-600" />}
        />
        <DashboardCard
          title="Net Returns"
          value={statistics.returns.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<GiPayMoney className="text-3xl text-purple-600" />}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-2 gap-6">
        <DashboardCard
          title="Liquidity Amount"
          value={statistics.liquidity.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<GiReceiveMoney className="text-3xl text-orange-600" />}
        />
        <DashboardCard
          title="Club Net Amount"
          value={statistics.netAmount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<RiMoneyRupeeCircleFill className="text-3xl text-teal-600" />}
        />
        <DashboardCard
          title="Member Value"
          value={statistics.memberValue.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaMoneyBillTransfer className="text-3xl text-indigo-600" />}
        />
        <DashboardCard
          title="Club Value"
          value={statistics.netValue.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          icon={<FaMoneyBillTrendUp className="text-3xl text-teal-600" />}
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PieChart
          available={statistics.liquidity}
          invested={statistics.invested}
          pending={statistics.balance}
        />
        <DoughnutChart
          deposit={statistics.deposit}
          offset={statistics.offset}
          returns={statistics.returns}
        />
      </div>
    </div>
  );
}
