import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

import prisma from "@/db";
import { fileDateTime } from "@/lib/date";

export async function POST() {
  try {
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
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
