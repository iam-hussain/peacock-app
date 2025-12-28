import { z } from "zod";

/**
 * API request/response validation schemas
 * Used for validating API route inputs
 */

// Transaction schemas
export const createTransactionSchema = z.object({
  fromId: z.string().min(1, "From account ID is required"),
  toId: z.string().min(1, "To account ID is required"),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .pipe(z.number().positive("Amount must be greater than zero")),
  transactionType: z.string().min(1, "Transaction type is required"),
  occurredAt: z
    .union([z.string().datetime(), z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  description: z.string().optional(),
  method: z.string().default("ACCOUNT"),
  currency: z.string().default("INR"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// Account schemas
export const createAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    )
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  avatar: z.string().optional(),
  active: z.boolean().default(true),
  startAt: z.string().datetime().optional().or(z.date().optional()),
  endAt: z.string().datetime().optional().or(z.date().optional()),
  isMember: z.boolean().optional(),
  readAccess: z.boolean().optional(),
  writeAccess: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.extend({
  id: z.string().min(1, "Account ID is required"),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  avatar: z.string().optional(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Recalculate schema
export const recalculateSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type RecalculateInput = z.infer<typeof recalculateSchema>;
