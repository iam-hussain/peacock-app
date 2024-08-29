"use server";

import prisma from "@/db";

type VendorToTransform ={
  id: string;
  name: string;
}

 function vendorsSelectTransform(vendor: VendorToTransform) {
  return {
    id: vendor.id,
    name: vendor.name
  };
}

export async function vendorsSelect() {
  const vendors = await prisma.vendor.findMany({
    select:{
     id: true,
     name: true,
    }
   });

  return vendors
    .map(vendorsSelectTransform)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
}

export type VendorSelectType = ReturnType<typeof vendorsSelectTransform>;
export type VendorsSelectResponse = Awaited<ReturnType<typeof vendorsSelect>>;
