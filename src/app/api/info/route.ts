export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import {
  clubConfig,
  clubData,
  transactionTypeHumanMap,
  transactionTypeMap,
} from "@/lib/config/config";

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: Get all accounts and club configuration
 *     description: Returns all accounts grouped by type (MEMBER, VENDOR, CLUB, SYSTEM) along with club configuration, club data, and transaction type mappings
 *     tags: [Info]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Accounts and club configuration information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Array of member accounts
 *                 vendor:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Array of vendor accounts
 *                 club:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Array of club accounts
 *                 system:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Array of system accounts
 *                 clubConfig:
 *                   type: object
 *                   description: Club configuration including stages, start date, and interest settings
 *                   properties:
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                     stages:
 *                       type: array
 *                       items:
 *                         type: object
 *                     alpha:
 *                       type: object
 *                     bravo:
 *                       type: object
 *                     dayInterestFrom:
 *                       type: string
 *                       format: date-time
 *                 clubData:
 *                   type: object
 *                   description: Club display data
 *                   properties:
 *                     sub:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                 transactionTypeMap:
 *                   type: object
 *                   description: Mapping of transaction types to display names
 *                 transactionTypeHumanMap:
 *                   type: object
 *                   description: Mapping of transaction types to human-readable descriptions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    // Fetch member from account table only
    const accounts = await prisma.account.findMany();

    return NextResponse.json(
      {
        member: accounts.filter((account) => account.type === "MEMBER"),
        vendor: accounts.filter((account) => account.type === "VENDOR"),
        club: accounts.filter((account) => account.type === "CLUB"),
        system: accounts.filter((account) => account.type === "SYSTEM"),
        clubConfig: clubConfig,
        clubData: clubData,
        transactionTypeMap: transactionTypeMap,
        transactionTypeHumanMap: transactionTypeHumanMap,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching member info:", error);
    return NextResponse.json(
      { error: "Failed to fetch member information" },
      { status: 500 }
    );
  }
}
