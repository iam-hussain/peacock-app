import { z } from "zod";

export const accountFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  avatar: z.string().optional().default(""),
  active: z.boolean().default(true),
  startAt: z.date(),
  endAt: z.date().optional(),
});

export type AccountFromSchema = z.infer<typeof accountFormSchema>;

export const vendorFormSchema = z.object({
  firstName: z.string().min(1, "Vendor name is required"),
  lastName: z.string().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  avatar: z.string().optional().default(""),
  active: z.boolean().default(true),
  startAt: z.date(),
  endAt: z.date().optional(),
});

export type VendorFormSchema = z.infer<typeof vendorFormSchema>;

export const transactionFormSchema = z.object({
  fromId: z.string().min(1, "From account is required"),
  toId: z.string().min(1, "To account is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  transactionType: z.string().min(1, "Type is required"),
  method: z.string().optional().default("ACCOUNT"),
  transactionAt: z.date(),
  note: z.string().optional(),
});

export type TransactionFormSchema = z.infer<typeof transactionFormSchema>;

export const offsetFormSchema = z.object({
  joiningOffset: z
    .number()
    .min(0, "Joining offset must be positive")
    .default(0),
  delayOffset: z.number().min(0, "Delay offset must be positive").default(0),
});

export type OffsetFromSchema = z.infer<typeof offsetFormSchema>;
