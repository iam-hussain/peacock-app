export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Account, Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { newZoneDate } from "@/lib/core/date";
import { chitCalculator } from "@/lib/helper";
import { VendorPassbookData } from "@/lib/validators/type";

type VendorToTransform = Account & { passbook: Passbook | null };

export async function POST() {
  try {
    const { requireAuth } = await import("@/lib/core/auth");
    await requireAuth();

    const vendors = await prisma.account.findMany({
      where: { type: "VENDOR" },
      include: { passbook: true },
    });

    const transformedVendors = vendors
      .map(transformVendorForTable)
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .sort((a, b) => (a.active > b.active ? -1 : 1));

    return NextResponse.json({ vendors: transformedVendors });
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

function transformVendorForTable(vendorInput: VendorToTransform) {
  const { passbook, ...vendor } = vendorInput;
  const { totalInvestment, totalReturns } = passbook
    ? (passbook.payload as VendorPassbookData)
    : { totalInvestment: 0, totalReturns: 0 };

  const statusData: {
    nextDueDate: number | null;
    monthsPassedString: string | null;
  } = { nextDueDate: null, monthsPassedString: null };

  if (vendor.active) {
    const chitData = chitCalculator(vendor.startedAt, vendor?.endedAt);
    statusData.nextDueDate = vendor.active ? chitData.nextDueDate : null;
    statusData.monthsPassedString = chitData.monthsPassedString;
  }

  const startAtMs = vendor.startedAt
    ? newZoneDate(vendor.startedAt).getTime()
    : null;
  const endAtMs = vendor.endedAt ? newZoneDate(vendor.endedAt).getTime() : null;

  return {
    id: vendor.id,
    name: `${vendor.firstName}${vendor.lastName ? ` ${vendor.lastName}` : ""}`,
    avatar: vendor.avatarUrl ? `/image/${vendor.avatarUrl}` : undefined,
    startAt: startAtMs,
    endAt: endAtMs,
    status: vendor.active ? "Active" : "Disabled",
    active: vendor.active,
    totalInvestment,
    totalReturns,
    totalProfitAmount: Math.max(totalReturns - totalInvestment, 0),
    ...statusData,
    account: { ...vendorInput, passbook: null },
  };
}

export type GetVendorResponse = { vendors: TransformedVendor[] };

export type TransformedVendor = ReturnType<typeof transformVendorForTable>;
