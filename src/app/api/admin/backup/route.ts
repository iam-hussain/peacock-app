export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import fs from "fs";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import path from "path";

import prisma from "@/db";
import { requireAdmin } from "@/lib/core/auth";
import { clearCache } from "@/lib/core/cache";
import { fileDateTime } from "@/lib/core/date";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/core/rate-limit";

export async function POST(request: Request) {
  // Rate limit heavy operations
  const rateLimited = rateLimitResponse(request, "backup", RATE_LIMITS.heavy);
  if (rateLimited) return rateLimited;

  revalidateTag("api");
  try {
    await requireAdmin();
    clearCache();
    // Fetch all data from Prisma models
    const account = await prisma.account.findMany();
    const transaction = await prisma.transaction.findMany();
    const passbook = await prisma.passbook.findMany();

    // Prepare the data
    const backupData = {
      account,
      transaction,
      passbook,
    };

    const fileName = `peacock_backup_${fileDateTime()}.json`;

    // Write the backup file to the writable /tmp directory
    const backupFilePath = path.join("/tmp", fileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    // Read the file and create a downloadable response
    const fileBuffer = fs.readFileSync(backupFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    if (
      error?.message === "FORBIDDEN_ADMIN" ||
      error?.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Backup failed",
      },
      { status: 500 }
    );
  }
}
