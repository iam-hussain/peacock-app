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
      : null,
    memberAvatar: vendor?.owner?.avatar
      ? `/image/${vendor.owner.avatar}`
      : "/image/no_image_available.jpeg",
    active: vendor.active,
    invest: vendor.passbook.in,
    profit: vendor.passbook.out,
    returns: vendor.passbook.calcReturns
      ? vendor.passbook.in - vendor.passbook.out
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
