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
 *                 configDetails:
 *                   type: object
 *                   description: Detailed documentation explaining the purpose and meaning of each configuration element
 *                   properties:
 *                     clubConfig:
 *                       type: object
 *                       properties:
 *                         purpose:
 *                           type: string
 *                         details:
 *                           type: object
 *                     clubData:
 *                       type: object
 *                       properties:
 *                         purpose:
 *                           type: string
 *                         details:
 *                           type: object
 *                     transactionTypeMap:
 *                       type: object
 *                       properties:
 *                         purpose:
 *                           type: string
 *                         details:
 *                           type: string
 *                     transactionTypeHumanMap:
 *                       type: object
 *                       properties:
 *                         purpose:
 *                           type: string
 *                         details:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  try {
    // Fetch all accounts from account table
    const accounts = await prisma.account.findMany();

    // Config details and purpose documentation
    const configDetails = {
      clubConfig: {
        purpose:
          "Defines the club's operational stages, deposit amounts, and interest calculation settings",
        details: {
          startedAt: "The date when the club officially started operations",
          stages:
            "Array of deposit stages (e.g., alpha, bravo) with their respective amounts and date ranges",
          alpha: "First deposit stage with lower monthly contribution amount",
          bravo: "Second deposit stage with higher monthly contribution amount",
          dayInterestFrom:
            "Date from which daily interest calculations are applied to loans",
        },
      },
      clubData: {
        purpose: "Display information for the club including name and avatar",
        details: {
          sub: "Club display name shown in the application",
          avatar: "Path to the club's logo/avatar image",
        },
      },
      transactionTypeMap: {
        purpose:
          "Maps transaction type enums to short display names for UI components",
        details:
          "Used for displaying transaction types in tables, forms, and reports",
      },
      transactionTypeHumanMap: {
        purpose:
          "Maps transaction type enums to detailed human-readable descriptions",
        details:
          "Used for tooltips, help text, and detailed transaction explanations",
      },
    };

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
        configDetails: configDetails,
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
