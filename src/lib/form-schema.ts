import { z } from "zod";

export const memberFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]),
  avatar: z.string().optional(),
  active: z.boolean().optional(),
  joinedAt: z.string().optional(),
});

export type MemberFromSchema = z.infer<typeof memberFormSchema>;

export const vendorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  terms: z.number().min(0, "Terms must be a positive number"),
  type: z.enum(["DEFAULT", "CHIT", "LEND", "BANK"], {
    required_error: "Please select a vendor type",
  }),
  ownerId: z.string().optional(),
  termType: z.enum(["NONE", "DAY", "WEEK", "MONTH", "YEAR"]).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  active: z.boolean(),
  calcReturns: z.boolean(),
});

export type VendorFromSchema = z.infer<typeof vendorFormSchema>;

// Transaction method and type enums
const transactionMethods = [
  "CASH",
  "ACCOUNT",
  "UPI",
  "BANK",
  "CHEQUE",
] as const;
const memberTransactionTypes = [
  "PERIODIC_DEPOSIT",
  "OFFSET_DEPOSIT",
  "WITHDRAW",
  "REJOIN",
  "FUNDS_TRANSFER",
] as const;

// Zod schema definition
export const memberTransactionFormSchema = z.object({
  fromId: z.string().min(1, { message: "Please select a 'from' member." }),
  toId: z.string().min(1, { message: "Please select a 'to' member." }),
  transactionType: z.enum(memberTransactionTypes, {
    required_error: "Please select a transaction type.",
    invalid_type_error: "Please select a transaction type.",
  }),
  method: z.enum(transactionMethods, {
    required_error: "Please select a transaction method.",
    invalid_type_error: "Please select a transaction method.",
  }),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Amount must be greater than 0." })
  ),
  note: z.string().optional(),
  transactionAt: z.string().optional(),
});

export type MemberTransactionFormSchema = z.infer<
  typeof memberTransactionFormSchema
>;

const vendorTransactionTypes = [
  "PERIODIC_INVEST",
  "INVEST",
  "PERIODIC_RETURN",
  "RETURNS",
  "PROFIT",
] as const;

// Zod schema definition
export const vendorTransactionFormSchema = z.object({
  vendorId: z.string().min(1, { message: "Please select a vendor." }),
  memberId: z.string().min(1, { message: "Please select a member." }),
  transactionType: z.enum(vendorTransactionTypes, {
    required_error: "Please select a transaction type.",
    invalid_type_error: "Please select a transaction type.",
  }),
  method: z.enum(transactionMethods, {
    required_error: "Please select a transaction method.",
    invalid_type_error: "Please select a transaction method.",
  }),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Amount must be greater than 0." })
  ),
  note: z.string().optional(),
  transactionAt: z.string().optional(),
});

export type VendorTransactionFormSchema = z.infer<
  typeof vendorTransactionFormSchema
>;
