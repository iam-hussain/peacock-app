import prisma from "@/db";
import { hashPassword } from "@/lib/core/auth";

/**
 * Ensures super admin account exists in the database
 * Called on app startup or in a setup script
 */
export async function setupSuperAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword =
    process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn(
      "⚠️  SUPER_ADMIN_PASSWORD or ADMIN_PASSWORD not set. Super admin login will not work."
    );
    return;
  }

  try {
    // Check if super admin account exists
    const existingAdmin = await prisma.account.findFirst({
      where: {
        username: adminUsername,
        role: "SUPER_ADMIN",
      },
    });

    if (existingAdmin) {
      // Update password if it changed
      const passwordHash = await hashPassword(adminPassword);
      if (existingAdmin.passwordHash !== passwordHash) {
        await prisma.account.update({
          where: { id: existingAdmin.id },
          data: {
            passwordHash,
            accessLevel: "ADMIN",
            active: true,
            role: "SUPER_ADMIN",
          },
        });
      }
      return;
    }

    // Create super admin account
    // First, we need to create a passbook for the admin
    const passbook = await prisma.passbook.create({
      data: {
        kind: "MEMBER",
        payload: {},
        loanHistory: [],
        joiningOffset: 0,
        delayOffset: 0,
        isChit: true,
      },
    });

    const passwordHash = await hashPassword(adminPassword);

    await prisma.account.create({
      data: {
        firstName: "Super",
        lastName: "Admin",
        username: adminUsername,
        passwordHash,
        role: "SUPER_ADMIN",
        accessLevel: "ADMIN",
        active: true,
        type: "MEMBER",
        passbookId: passbook.id,
      },
    });
  } catch (error: any) {
    console.error("❌ Error setting up super admin:", error);
    throw error;
  }
}
