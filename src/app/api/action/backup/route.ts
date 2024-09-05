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

    // Convert to JSON and save in the public directory
    const backupFilePath = path.join(
      process.cwd(),
      "public",
      "peacock_backup.json"
    );
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    // Return the file path
    return NextResponse.json({ success: true, file: "/peacock_backup.json" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
