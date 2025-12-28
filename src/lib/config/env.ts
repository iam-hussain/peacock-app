import { z } from "zod";

/**
 * Environment variable schema validation
 * Validates environment variables with lenient defaults for development
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database (required only in production)
  DATABASE_URL: z.string().min(1).optional(),

  // JWT/Auth secrets (optional, will use fallback)
  JWT_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),

  // Super Admin credentials (optional, will use defaults)
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),

  // Next.js public variables (optional)
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
});

type EnvSchema = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Uses lenient parsing to avoid build-time failures
 */
function getEnv(): EnvSchema {
  try {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
      ADMIN_USERNAME: process.env.ADMIN_USERNAME,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  } catch (error) {
    // In development, log warning but don't fail
    if (process.env.NODE_ENV !== "production" && error instanceof z.ZodError) {
      console.warn(
        "⚠️ Environment variable validation warnings:",
        error.errors
      );
      // Return defaults for development
      return {
        NODE_ENV: "development",
        ADMIN_USERNAME: "admin",
      } as EnvSchema;
    }
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}

export const env = getEnv();

/**
 * Get JWT secret with fallback
 */
export function getJwtSecret(): string {
  return (
    env.JWT_SECRET || env.AUTH_SECRET || "default-secret-change-in-production"
  );
}

/**
 * Get admin password with fallback
 */
export function getAdminPassword(): string | undefined {
  return env.ADMIN_PASSWORD || env.SUPER_ADMIN_PASSWORD;
}
