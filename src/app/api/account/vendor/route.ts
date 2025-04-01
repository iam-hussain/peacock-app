export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Account, Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { chitCalculator } from "@/lib/helper";
import { VendorPassbookData } from "@/lib/type";

type VendorToTransform = Account & {
  passbook: Passbook;
};

export async function GET() {
  const vendors = await prisma.account.findMany({
    where: {
      isMember: false,
    },
    include: {
      passbook: true,
    },
  });

  const transformedVendors = vendors
    .map(transformVendorForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    vendors: transformedVendors,
  });
}

function transformVendorForTable(vendorInput: VendorToTransform) {
  const { passbook, ...vendor } = vendorInput;
  const { totalInvestment, totalReturns } =
    passbook.payload as VendorPassbookData;

  const statusData: {
    nextDueDate: number | null;
    monthsPassedString: string | null;
  } = {
    nextDueDate: null,
    monthsPassedString: null,
  };

  if (vendor.active) {
    const chitData = chitCalculator(vendor.startAt, vendor?.endAt);
    statusData.nextDueDate = vendor.active ? chitData.nextDueDate : null;
    statusData.monthsPassedString = chitData.monthsPassedString;
  }

  return {
    id: vendor.id,
    name: `${vendor.firstName}${vendor.lastName ? ` ${vendor.lastName}` : ""}`,
    avatar: vendor.avatar ? `/image/${vendor.avatar}` : undefined,
    startAt: vendor.startAt.getTime(),
    endAt: vendor.endAt ? vendor.endAt.getTime() : null,
    status: vendor.active ? "Active" : "Disabled",
    active: vendor.active,
    totalInvestment,
    totalReturns,
    totalProfitAmount: Math.max(totalReturns - totalInvestment, 0),
    ...statusData,
    account: { ...vendorInput, passbook: null },
  };
}

export type GetVendorResponse = {
  vendors: TransformedVendor[];
};

export type TransformedVendor = ReturnType<typeof transformVendorForTable>;
