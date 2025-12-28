import { NextResponse } from "next/server";

import prisma from "@/db";
import { getMemberClubStats } from "@/lib/calculators/member-club-stats";
import { memberMonthsPassedString } from "@/lib/core/date";
import {
  membersTableTransform,
  TransformedLoan,
  TransformedMember,
  transformLoanForTable,
} from "@/transformers/account";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * @swagger
 * /api/account/member/{username}:
 *   post:
 *     summary: Get member by username
 *     description: Retrieves detailed member information including loan data, club statistics, and membership duration
 *     tags: [Account]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Member username
 *         example: "john.doe"
 *     responses:
 *       200:
 *         description: Member details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
 *                   type: object
 *                   description: Complete member information including account, loan, and statistics
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Account ID
 *                     username:
 *                       type: string
 *                       description: Username
 *                     firstName:
 *                       type: string
 *                       description: First name
 *                     lastName:
 *                       type: string
 *                       nullable: true
 *                       description: Last name
 *                     active:
 *                       type: boolean
 *                       description: Whether member is active
 *                     loanHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Historical loan records
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch member.
 */
export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    const account = await prisma.account.findUniqueOrThrow({
      where: { username, type: "MEMBER" },
      include: { passbook: true },
    });

    const stats = await getMemberClubStats();
    const {
      memberTotalDeposit,
      totalReturnPerMember,
      expectedLoanProfitPerMember,
    } = stats;

    const memberLoan = await transformLoanForTable(account);
    const memberData = membersTableTransform(
      account,
      memberTotalDeposit,
      totalReturnPerMember,
      expectedLoanProfitPerMember
    );

    return NextResponse.json({
      member: {
        ...memberLoan,
        ...memberData,
        ...memberMonthsPassedString(account.startedAt),
      },
    });
  } catch (error) {
    console.error("Error fetching member by username:", error);
    return NextResponse.json(
      { message: "Failed to fetch member." },
      { status: 500 }
    );
  }
}

export type GetMemberByUsernameResponse = {
  member: TransformedMember &
    TransformedLoan &
    ReturnType<typeof memberMonthsPassedString>;
};
