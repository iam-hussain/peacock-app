import { NextResponse } from "next/server";
import { calculateDueDates, dateFormat } from "@/lib/date";
import prisma from "@/db";
import { Passbook, Vendor } from "@prisma/client";

type VendorToTransform = Vendor & {
  passbook: Passbook;
  owner: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null;
};

export type VendorResponse = ReturnType<typeof vendorsTableTransform>;

function vendorsTableTransform(vendor: VendorToTransform) {
  const { passbook, owner, ...rawVendor } = vendor;
  const memberName = vendor?.owner?.firstName
    ? `${vendor.owner.firstName} ${vendor.owner.lastName || ""}`
    : "";

  const due = {
    nextDueDate: 0,
    recentDueDate: 0,
    currentTerm: 0,
    dueAmount: 0,
  };

  if (rawVendor.type === "CHIT") {
    const dueDates = calculateDueDates(vendor.startAt);
    due.nextDueDate = dueDates.nextDueDate.getTime();
    due.recentDueDate = dueDates.recentDueDate.getTime();
    due.currentTerm = dueDates.monthsPassed;
  }

  return {
    id: vendor.id,
    name: vendor.name,
    searchName: `${vendor.name} ${memberName}`.trim(),
    startAt: vendor.startAt.getTime(),
    endAt: vendor.endAt ? vendor.endAt.getTime() : null,
    terms: vendor.terms,
    type: vendor.type,
    memberName,
    memberAvatar: vendor?.owner?.avatar
      ? `/image/${vendor.owner.avatar}`
      : undefined,
    active: vendor.active,
    invest: vendor.passbook.in,
    profit: vendor.passbook.out,
    returns: vendor.passbook.returns,
    calcReturns: passbook.calcReturns,
    ...due,
    vendor: { ...rawVendor, calcReturns: passbook.calcReturns },
  };
}

export async function GET(request: Request) {
  const vendors = await prisma.vendor.findMany({
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
    .map(vendorsTableTransform)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    vendors: transformedVendors,
  });
}

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
      active: typeof active === "boolean" ? active : true,
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
