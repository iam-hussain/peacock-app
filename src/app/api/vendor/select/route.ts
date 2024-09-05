import prisma from "@/db";
import { NextResponse } from "next/server";

type VendorToTransform = {
  id: string;
  name: string;
  active: boolean;
  owner: {
    firstName: string;
    lastName: string | null;
  } | null;
};

function vendorsSelectTransform(vendor: VendorToTransform) {
  return {
    id: vendor.id,
    name: `${vendor.name}${vendor.owner?.firstName ? ` - ${vendor.owner.firstName} ${vendor.owner.lastName || " "}` : ""}`,
    active: vendor.active,
  };
}

export type TransformedVendorSelect = ReturnType<typeof vendorsSelectTransform>;

export async function GET(request: Request) {
  const vendors = await prisma.vendor.findMany({
    select: {
      id: true,
      name: true,
      active: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json(
    vendors
      .map(vendorsSelectTransform)
      .sort((a, b) => (a.name > b.name ? 1 : -1)),
  );
}
