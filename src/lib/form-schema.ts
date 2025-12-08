import { z } from "zod";

export type AccountFromSchema = z.infer<typeof accountFormSchema>;

export type OffsetFromSchema = z.infer<typeof offsetFormSchema>;

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

export const accountFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  slug: z
    .string()
    .min(1, "Username is required")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    )
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
  lastName: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true; // Optional field
        // Remove +91 prefix if present and check if exactly 10 digits remain
        const digits = val.replace(/^\+91/, "").replace(/\D/g, "");
        return digits.length === 10;
      },
      {
        message: "Phone number must be exactly 10 digits",
      }
    ),
  email: z.union([z.literal(""), z.string().email()]),
  avatar: z.string().optional(),
  active: z.boolean().optional(),
  startAt: datePickerFormSchema,
  endAt: datePickerFormSchema,
});

const transactionTypes = [
  "PERIODIC_DEPOSIT",
  "OFFSET_DEPOSIT",
  "WITHDRAW",
  "REJOIN",
  "FUNDS_TRANSFER",
  "VENDOR_INVEST",
  "VENDOR_RETURNS",
  "LOAN_TAKEN",
  "LOAN_REPAY",
  "LOAN_INTEREST",
] as const;

// Zod schema definition
export const transactionFormSchema = z.object({
  fromId: z.string().min(1, { message: "Please select a valid input." }),
  toId: z.string().min(1, { message: "Please select a valid input." }),
  transactionType: z.enum(transactionTypes, {
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
  transactionAt: datePickerFormSchema,
});

// Zod schema definition
export const offsetFormSchema = z.object({
  joiningOffset: z.preprocess(
    (val) => Number(val),
    z.number().min(0, {
      message: "Reduce profit amount must be greater than or equal to 0.",
    })
  ),
  delayOffset: z.preprocess(
    (val) => Number(val),
    z.number().min(0, {
      message: "Reduce profit amount must be greater than or equal to 0.",
    })
  ),
});
