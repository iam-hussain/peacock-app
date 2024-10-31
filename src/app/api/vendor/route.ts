import { Passbook, Vendor } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { chitCalculator } from "@/lib/calc";

type VendorToTransform = Vendor & {
  passbook: Passbook;
  owner: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null;
};

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    where: {
      type: {
        notIn: ["LEND", "HOLD"],
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
        },
      },
      passbook: true,
    },
  });

  const transformedVendors = vendors
    .map(transformVendorForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.type > b.type ? -1 : 1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    vendors: transformedVendors,
  });
}

function transformVendorForTable(vendorInput: VendorToTransform) {
  const { passbook, owner, ...vendor } = vendorInput;
  const memberName = owner?.firstName
    ? `${owner.firstName} ${owner.lastName || ""}`
    : "";

  const statusData: {
    nextDueDate: Date | null;
    balanceAmount: number;
    period: string | null;
  } = {
    nextDueDate: null,
    balanceAmount: 0,
    period: null,
  };

  if (vendor.type === "CHIT") {
    const chitData = chitCalculator(vendor.startAt, vendor?.endAt);
    statusData.nextDueDate = vendor.active ? chitData.nextDueDate : null;
    statusData.period = chitData.period;
  }

  return {
    id: vendor.id,
    name: `${vendor.name}${owner?.firstName ? ` - ${owner.firstName} ${owner.lastName || " "}` : ""}`,
    vendorName: vendor.name,
    searchName: `${vendor.name} ${memberName}`.trim(),
    startAt: vendor.startAt.getTime(),
    endAt: vendor.endAt ? vendor.endAt.getTime() : null,
    type: vendor.type,
    memberName,
    memberAvatar: owner?.avatar ? `/image/${owner.avatar}` : undefined,
    active: vendor.active,
    invest: passbook.in,
    profit: passbook.out,
    returns: passbook.returns,
    calcReturns: passbook.calcReturns,
    ...statusData,
    vendor: { ...vendor, calcReturns: passbook.calcReturns },
  };
}

export type GetVendorResponse = {
  vendors: TransformedVendor[];
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      name,
      slug,
      terms,
      type,
      ownerId,
      termType,
      startAt,
      endAt,
      active,
      calcReturns,
    } = data;

    // Validate required fields
    if (!name && !id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commonData = {
      name,
      slug: slug || name.toLowerCase().trim().replace(" ", "_"),
      terms: terms ?? 0,
      type: type ?? "DEFAULT",
      ownerId: ownerId || undefined,
      termType: termType ?? "MONTH",
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: endAt ? new Date(endAt) : undefined,
      active: active ?? true,
    };

    let vendor;

    if (id) {
      // Update vendor if ID is provided
      vendor = await prisma.vendor.update({
        where: { id },
        data: commonData,
      });

      // Update passbook's calcReturns field if provided
      if (typeof calcReturns === "boolean") {
        await prisma.passbook.updateMany({
          where: {
            type: "VENDOR",
            vendor: { id },
          },
          data: { calcReturns },
        });
      }
    } else {
      const members = await prisma.member.findMany({
        select: { id: true, active: true },
      });
      // Create a new vendor if no ID is provided
      vendor = await prisma.vendor.create({
        data: {
          ...commonData,
          passbook: {
            create: {
              type: "VENDOR",
              calcReturns: calcReturns ?? true,
            },
          },
          profitShares: {
            createMany: {
              data: members.map((e) => ({
                memberId: e.id,
                active: e.active,
              })),
            },
          },
        },
      });
    }

    return NextResponse.json({ vendor }, { status: 200 });
  } catch (error) {
    console.error("Error creating/updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export type TransformedVendor = ReturnType<typeof transformVendorForTable>;
