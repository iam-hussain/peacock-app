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
  const {
    totalInvestment,
    totalReturns,
    totalProfitAmount,
    includedMembersCount,
  } = passbook.payload as VendorPassbookData;

  const statusData: {
    nextDueDate: number | null;
    monthsPassedString: string | null;
  } = {
    nextDueDate: null,
    monthsPassedString: null,
  };

  if (passbook.isChit && vendor.active) {
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
    totalProfitAmount,
    includedMembersCount,
    ...statusData,
    vendor: { ...vendor, isChit: passbook.isChit },
  };
}

export type GetVendorResponse = {
  vendors: TransformedVendor[];
};

export type TransformedVendor = ReturnType<typeof transformVendorForTable>;
