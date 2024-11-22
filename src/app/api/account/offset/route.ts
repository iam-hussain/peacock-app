import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";

// PATCH Request to update the member's vendor connections
export async function POST(request: Request) {
  const { passbookId, joiningOffset, delayOffset } = await request.json();

  if (!passbookId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  await prisma.passbook.update({
    where: {
      id: passbookId,
    },
    data: {
      joiningOffset,
      delayOffset,
    },
  });

  revalidatePath("/member");
  revalidatePath("/vendor");
  revalidatePath("/loan");
  revalidatePath("/transaction");
  revalidatePath("/dashboard");

  return NextResponse.json({ joiningOffset, delayOffset });
}
