import prisma from "@/db";
import {
  ClubFinancialSnapshot,
  MemberFinancialSnapshot,
} from "@/lib/validators/type";

type ValidationInput = {
  transactionType: string;
  amount: number;
  fromId: string;
  toId: string;
};

/**
 * Validates business rules for a transaction before creation.
 * Returns an error message string if invalid, or null if valid.
 */
export async function validateTransactionBusinessRules(
  input: ValidationInput
): Promise<string | null> {
  const { transactionType, amount, fromId, toId } = input;

  switch (transactionType) {
    case "LOAN_REPAY": {
      // Member (fromId) cannot repay more than their outstanding loan balance
      const memberPassbook = await prisma.passbook.findFirst({
        where: { account: { id: fromId } },
        select: { payload: true },
      });
      if (!memberPassbook) return "Member passbook not found";
      const payload = memberPassbook.payload as MemberFinancialSnapshot;
      const outstanding = payload.loansOutstanding ?? 0;
      if (amount > outstanding) {
        return `Repayment amount (${amount}) exceeds outstanding loan balance (${outstanding})`;
      }
      return null;
    }

    case "WITHDRAW": {
      // Member (toId) cannot withdraw more than their member balance
      const memberPassbook = await prisma.passbook.findFirst({
        where: { account: { id: toId } },
        select: { payload: true },
      });
      if (!memberPassbook) return "Member passbook not found";
      const payload = memberPassbook.payload as MemberFinancialSnapshot;
      const balance = payload.memberBalance ?? 0;
      if (amount > balance) {
        return `Withdrawal amount (${amount}) exceeds member balance (${balance})`;
      }
      return null;
    }

    case "LOAN_TAKEN":
    case "VENDOR_INVEST": {
      // Cannot exceed available cash balance
      const clubPassbook = await prisma.passbook.findFirst({
        where: { kind: "CLUB" },
        select: { payload: true },
      });
      if (!clubPassbook) return "Club passbook not found";
      const payload = clubPassbook.payload as ClubFinancialSnapshot;
      const available = payload.availableCashBalance ?? 0;
      const label = transactionType === "LOAN_TAKEN" ? "Loan" : "Investment";
      if (amount > available) {
        return `${label} amount (${amount}) exceeds available cash balance (${available})`;
      }
      return null;
    }

    default:
      return null; // No validation needed for other types
  }
}
