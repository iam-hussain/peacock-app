export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { TransactionType } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireWriteAccess } from "@/lib/core/auth";
import { invalidateTransactionCaches } from "@/lib/core/cache-invalidation";
import { createTransactionSchema } from "@/lib/validators/api-schemas";
import { validateTransactionBusinessRules } from "@/lib/validators/transaction-business-rules";
import { transactionEntryHandler } from "@/logic/transaction-handler";

/**
 * @swagger
 * /api/transaction/create:
 *   post:
 *     summary: Create a new transaction
 *     description: Creates a new financial transaction between accounts. Requires write access. Updates passbooks automatically.
 *     tags: [Transaction]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromId
 *               - toId
 *               - amount
 *               - transactionType
 *             properties:
 *               fromId:
 *                 type: string
 *                 description: Source account ID
 *                 example: "507f1f77bcf86cd799439011"
 *               toId:
 *                 type: string
 *                 description: Destination account ID
 *                 example: "507f1f77bcf86cd799439012"
 *               amount:
 *                 type: number
 *                 description: Transaction amount (must be positive)
 *                 minimum: 0.01
 *                 example: 1000.50
 *               transactionType:
 *                 type: string
 *                 enum: [DEPOSIT, WITHDRAWAL, LOAN, LOAN_REPAYMENT, INTEREST, FEE, TRANSFER]
 *                 description: Type of transaction
 *                 example: DEPOSIT
 *               occurredAt:
 *                 type: string
 *                 format: date-time
 *                 description: Transaction timestamp (defaults to now if not provided)
 *                 example: "2024-01-15T10:30:00Z"
 *               description:
 *                 type: string
 *                 description: Optional transaction description
 *                 example: "Monthly deposit"
 *               referenceId:
 *                 type: string
 *                 description: Optional external reference (loan ID, UPI ref, cheque number, etc.)
 *                 example: "507f1f77bcf86cd799439099"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - write access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to create transaction
 */
export async function POST(request: Request) {
  try {
    await requireWriteAccess();
    const body = await request.json();

    // Validate input with Zod
    const validationResult = createTransactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { fromId, toId, amount, transactionType, occurredAt, description, referenceId } =
      validationResult.data;

    // Validate business rules (e.g., sufficient balance, outstanding loan limits)
    const validationError = await validateTransactionBusinessRules({
      transactionType,
      amount,
      fromId,
      toId,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Create transaction and update passbooks atomically within a single DB transaction.
    // If any step fails, the entire operation is rolled back automatically by Prisma.
    const created = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          fromId,
          toId,
          amount,
          type: transactionType as TransactionType,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
          description: description || null,
          referenceId: referenceId || null,
          method: "ACCOUNT",
          currency: "INR",
        },
      });

      await transactionEntryHandler(transaction, false, tx);
      return transaction;
    });

    // Clear all caches after transaction creation
    await invalidateTransactionCaches();

    return NextResponse.json({ transaction: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    if (error instanceof Error) {
      if (
        error.message === "UNAUTHORIZED" ||
        error.message === "FORBIDDEN_WRITE" ||
        error.message === "FORBIDDEN_ADMIN"
      ) {
        const { handleAuthError } = await import("@/lib/core/error-handler");
        return handleAuthError(error);
      }
    }
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
