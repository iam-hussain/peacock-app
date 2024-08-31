import { NextResponse } from "next/server";
import { dateFormat } from "@/lib/date";
import prisma from "@/db";
import { Passbook, Vendor } from "@prisma/client";

type VendorToTransform = Vendor & {
  passbook: Passbook;
  owner: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
    active: boolean;
  } | null;
};

export type VendorResponse = ReturnType<typeof vendorsTableTransform>;

function vendorsTableTransform(vendor: VendorToTransform) {
  return {
    id: vendor.id,
    name: vendor.name,
    startAt: dateFormat(vendor.startAt),
    endAt: vendor.endAt ? dateFormat(vendor.endAt) : null,
    terms: vendor.terms,
    memberName: vendor?.owner?.firstName
      ? `${vendor.owner.firstName} ${vendor.owner.lastName || ""}`
      : "",
    memberAvatar: vendor?.owner?.avatar
      ? `/image/${vendor.owner.avatar}`
      : undefined,
    active: vendor.active,
    invest: vendor.passbook.in,
    profit: vendor.passbook.out,
    returns: vendor.passbook.calcReturns
      ? vendor.passbook.out - vendor.passbook.in
      : 0,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const vendors = await prisma.vendor.findMany({
    skip: (page - 1) * limit,
    take: limit,
    include: {
      owner: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
          active: true,
        },
      },
      passbook: true,
    },
  });

  const transformedVendors = vendors
    .map(vendorsTableTransform)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? 1 : -1));

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
