import { $Enums } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";

type VendorToTransform = {
  id: string;
  name: string;
  type: $Enums.VENDOR_TYPE;
  active: boolean;
  owner: {
    firstName: string;
    lastName: string | null;
  } | null;
};

function vendorsSelectTransform(vendor: VendorToTransform) {
  const connectedName = vendor.owner?.firstName
    ? ` - ${vendor.owner.firstName} ${vendor.owner.lastName || " "}`
    : "";
  let name = `${vendor.name}${connectedName}`;

  if (vendor.type === "HOLD") {
    name = `Hold${connectedName}`;
  }

  return {
    id: vendor.id,
    name,
    active: vendor.active,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const vendors = await prisma.vendor.findMany({
    where: {
      ...(type
        ? {
            type: {
              in: (type?.split("-") as any) || [],
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      active: true,
      type: true,
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
      .sort((a, b) => (a.name > b.name ? 1 : -1))
  );
}

export type TransformedVendorSelect = ReturnType<typeof vendorsSelectTransform>;
