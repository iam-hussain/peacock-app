import prisma from "@/db";
import { NextResponse } from "next/server";

type VendorToTransform = {
  id: string;
  name: string;
  active: boolean;
};

function vendorsSelectTransform(vendor: VendorToTransform) {
  return {
    id: vendor.id,
    name: vendor.name,
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
    },
  });

  return NextResponse.json(
    vendors
      .map(vendorsSelectTransform)
      .sort((a, b) => (a.name > b.name ? 1 : -1)),
  );
}
