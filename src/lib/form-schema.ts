import { z } from "zod";

export type MemberFromSchema = z.infer<typeof memberFormSchema>;

export type VendorFromSchema = z.infer<typeof vendorFormSchema>;

export type TransactionFormSchema = z.infer<typeof transactionFormSchema>;

export const datePickerFormSchema = z
  .date()
  .optional()
  .refine((date) => !date || date instanceof Date, {
    message: "Invalid date",
  });

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

export const memberFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]),
  avatar: z.string().optional(),
  active: z.boolean().optional(),
  joinedAt: datePickerFormSchema,
});

export const vendorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  terms: z.number().min(0, "Terms must be a positive number"),
  type: z.enum(["DEFAULT", "CHIT", "LEND", "BANK"], {
    required_error: "Please select a vendor type",
  }),
  ownerId: z.string().optional(),
  termType: z.enum(["NONE", "DAY", "WEEK", "MONTH", "YEAR"]).optional(),
  startAt: datePickerFormSchema,
  endAt: datePickerFormSchema,
  active: z.boolean().optional(),
  calcReturns: z.boolean().optional(),
});

const transactionTypes = [
  "PERIODIC_DEPOSIT",
  "OFFSET_DEPOSIT",
  "PERIODIC_RETURN",
  "WITHDRAW",
  "REJOIN",
  "FUNDS_TRANSFER",
  "INVEST",
  "RETURNS",
  "PROFIT",
] as const;

const vendorType = ["DEFAULT", "LEND"] as const;

// Zod schema definition
export const transactionFormSchema = z.object({
  fromId: z.string().min(1, { message: "Please select a valid input." }),
  toId: z.string().min(1, { message: "Please select a valid input." }),
  transactionType: z.enum(transactionTypes, {
    required_error: "Please select a transaction type.",
    invalid_type_error: "Please select a transaction type.",
  }),
  vendorType: z.enum(vendorType, {
    required_error: "Please select a transaction vendor type.",
    invalid_type_error: "Please select a transaction vendor type.",
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
  transactionAt: datePickerFormSchema,
});

// Zod schema definition
export const memberConnectionFormSchema = z.object({
  loanOffset: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .min(0.01, { message: "Reduce profit amount must be greater than 0." })
  ),
  connections: z.array(
    z.object({
      id: z.string(),
      active: z.boolean(),
    })
  ),
});
