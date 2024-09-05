import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

import prisma from "@/db";

export async function POST() {
  try {
    // Fetch all data from Prisma models
    const members = await prisma.member.findMany({
      include: {
        vendors: true,
        passbook: true,
        transactionFrom: true,
        transactionTo: true,
      },
    });
    const vendors = await prisma.vendor.findMany({
      include: { transactions: true, profitShares: true, passbook: true },
    });
    const memberTransactions = await prisma.memberTransaction.findMany();
    const vendorTransactions = await prisma.vendorTransaction.findMany();
    const vendorProfitShares = await prisma.vendorProfitShare.findMany();
    const passbooks = await prisma.passbook.findMany();

    // Prepare the data
    const backupData = {
      members,
      vendors,
      memberTransactions,
      vendorTransactions,
      vendorProfitShares,
      passbooks,
    };

    // Write the backup file to the writable /tmp directory
    const backupFilePath = path.join("/tmp", "peacock_backup.json");
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    // Read the file and create a downloadable response
    const fileBuffer = fs.readFileSync(backupFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="peacock_backup.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
