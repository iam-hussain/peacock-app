import { NextResponse } from "next/server";

import { TransformedTransaction } from "@/app/api/transaction/route";
import prisma from "@/db";
import { clubData } from "@/lib/config/config";
import { requireWriteAccess } from "@/lib/core/auth";
import { invalidateTransactionCaches } from "@/lib/core/cache-invalidation";
import { newZoneDate } from "@/lib/core/date";
import { transactionEntryHandler } from "@/logic/transaction-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function findTransaction(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      from: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          type: true,
        },
      },
      to: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          type: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

function transform(transaction: any): TransformedTransaction {
  const fromName = `${transaction.from.firstName || ""} ${transaction.from.lastName || ""}`;
  const toName = `${transaction.to.firstName || ""} ${transaction.to.lastName || ""}`;

  const updated = {
    from: {
      ...transaction.from,
      name: fromName,
      sub: "",
      avatar: transaction.from.avatarUrl
        ? `/image/${transaction.from.avatarUrl}`
        : undefined,
      link:
        transaction.from.type === "MEMBER"
          ? `/dashboard/member/${transaction.from.username}`
          : undefined,
    },
    to: {
      ...transaction.to,
      name: toName,
      sub: "",
      avatar: transaction.to.avatarUrl
        ? `/image/${transaction.to.avatarUrl}`
        : undefined,
      link:
        transaction.to.type === "MEMBER"
          ? `/dashboard/member/${transaction.to.username}`
          : undefined,
    },
  };

  if (["LOAN_TAKEN"].includes(transaction.type)) {
    updated.to.sub = "Loan Account";
  }

  if (["LOAN_REPAY", "LOAN_INTEREST"].includes(transaction.type)) {
    updated.from.sub = "Loan Account";
    updated.to.sub = "Club Account";
  }

  if (
    ["WITHDRAW", "LOAN_TAKEN", "VENDOR_INVEST", "FUNDS_TRANSFER"].includes(
      transaction.type
    )
  ) {
    updated.from.sub = "Club Account";
    updated.from.avatar = clubData.avatar;
  }

  if (
    [
      "PERIODIC_DEPOSIT",
      "VENDOR_RETURNS",
      "OFFSET_DEPOSIT",
      "LOAN_REPAY",
      "LOAN_INTEREST",
      "FUNDS_TRANSFER",
    ].includes(transaction.type)
  ) {
    updated.to.sub = clubData.sub;
    updated.to.avatar = clubData.avatar;
  }

  const createdByName = transaction.createdBy
    ? `${transaction.createdBy.firstName} ${transaction.createdBy.lastName || ""}`.trim()
    : null;
  const updatedByName = transaction.updatedBy
    ? `${transaction.updatedBy.firstName} ${transaction.updatedBy.lastName || ""}`.trim()
    : null;

  return {
    ...transaction,
    ...updated,
    transactionType: transaction.type,
    createdByName,
    updatedByName,
    createdById: transaction.createdById,
    updatedById: transaction.updatedById,
    createdAt: newZoneDate(transaction.createdAt),
    updatedAt: newZoneDate(transaction.updatedAt),
  };
}

export async function GET(_req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const transaction = await findTransaction(id);

    if (!transaction) {
      return NextResponse.json(
        { transaction: null, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction: transform(transaction),
    });
  } catch (error: any) {
    console.error("Error fetching transaction by id:", error);
    return NextResponse.json(
      { transaction: null, error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const _user = await requireWriteAccess();

    // Check if the transaction exists
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    // Revert passbook changes before deleting the transaction
    // If this fails, the transaction will be deleted but passbooks will be out of sync
    try {
      if (transaction) {
        await transactionEntryHandler(transaction, true);
      }
    } catch (handlerError: any) {
      console.error(
        `⚠️ Transaction ${id} deletion: passbook revert failed. ` +
          `Transaction will be deleted but passbooks may be out of sync. ` +
          `Run recalculation to fix. Error: ${handlerError.message}`
      );
      // Continue with deletion even if passbook revert failed
      // The transaction will be deleted, but passbooks need recalculation
    }

    // Delete the transaction
    await prisma.transaction.delete({ where: { id } });

    // Clear all caches after transaction deletion
    await invalidateTransactionCaches();

    return NextResponse.json(
      { message: "Transaction deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    const { handleAuthError } = await import("@/lib/core/error-handler");
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "FORBIDDEN_WRITE" ||
      error.message === "FORBIDDEN_ADMIN"
    ) {
      return handleAuthError(error);
    }
    return NextResponse.json(
      { message: "Failed to delete transaction." },
      { status: 500 }
    );
  }
}
