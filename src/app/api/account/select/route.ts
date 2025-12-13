export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";

type AccountToTransform = {
  id: string;
  username: string;
  firstName: string;
  lastName: string | null;
  active: boolean;
  isMember: boolean;
};

function accountSelectTransform(account: AccountToTransform) {
  return {
    id: account.id,
    username: account.username,
    name: `${account.firstName}${account.lastName ? ` ${account.lastName}` : ""}`,
    active: account.active,
    isMember: (account.type === 'MEMBER'),
  };
}

export async function POST() {
  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      active: true,
      type: 'MEMBER',
    },
  });

  return NextResponse.json(
    accounts
      .map(accountSelectTransform)
      .sort((a, b) => (a.name > b.name ? 1 : -1))
  );
}

export type TransformedAccountSelect = ReturnType<
  typeof accountSelectTransform
>;
