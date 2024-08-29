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

function vendorsTableTransform(vendor: VendorToTransform) {
    const { passbook, owner, ...rawVendor } = vendor;
    return {
        id: vendor.id,
        name: vendor.name,
        startAt: dateFormat(vendor.startAt),
        endAt: vendor.endAt ? dateFormat(vendor.endAt) : null,
        terms: vendor.terms,
        memberName: vendor?.owner?.firstName
            ? `${vendor.owner.firstName} ${vendor.owner.lastName || ""}`
            : "sdsd",
        memberAvatar: vendor?.owner?.avatar
            ? `/image/${vendor.owner.avatar}`
            : "/image/no_image_available.jpeg",
        active: vendor.active,
        invest: vendor.passbook.in,
        profit: vendor.passbook.out,
        returns: vendor.passbook.calcReturns
            ? vendor.passbook.out - vendor.passbook.in
            : 0,
        vendor: rawVendor
    };
}

export async function getVendors() {
    const vendors = await prisma.vendor.findMany({
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

    return transformedVendors
}


export type GetVendorResponse = ReturnType<typeof vendorsTableTransform>;

export type GetVendorsResponse = Awaited<ReturnType<typeof getVendors>>;
