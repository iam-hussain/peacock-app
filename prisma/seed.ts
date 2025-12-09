import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

import { generateVendorUsername } from "../src/lib/helper";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function seed() {
  const backupFilePath = path.join(
    process.cwd(),
    "public",
    "peacock_backup.json"
  );
  const backupData = JSON.parse(readFileSync(backupFilePath, "utf8"));

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.passbook.deleteMany();

  // Insert the data into Prisma models
  await prisma.passbook.createMany({ data: backupData.passbook });

  // Map accounts to include new auth fields with defaults
  // Track usernames to ensure uniqueness
  const usedUsernames = new Set<string>();

  const accountsWithDefaults = backupData.account.map((account: any) => {
    // Determine username: use existing username, or slug (for backward compatibility), or generate for vendors
    let username: string;
    if (account.username) {
      username = account.username;
    } else if (account.slug) {
      // For backward compatibility, use slug as username
      username = account.slug;
    } else if (account.isMember === false) {
      // Vendor: generate username
      username = generateVendorUsername(account.firstName, account.lastName);
    } else {
      // Member without username or slug: use a generated one based on name
      const name = [account.firstName, account.lastName]
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      username = name || `member-${account.id}`;
    }

    // Ensure username is unique
    let finalUsername = username;
    let counter = 1;
    while (usedUsernames.has(finalUsername)) {
      finalUsername = `${username}_${counter}`;
      counter++;
    }
    usedUsernames.add(finalUsername);

    // Destructure to exclude slug field
    const { slug, ...accountWithoutSlug } = account;

    return {
      ...accountWithoutSlug,
      username: finalUsername, // Required field, guaranteed unique
      passwordHash: account.passwordHash || null,
      role: account.role || "MEMBER",
      readAccess: account.readAccess ?? account.canRead ?? true,
      writeAccess: account.writeAccess ?? account.canWrite ?? false,
      lastLoginAt: account.lastLoginAt || null,
    };
  });

  await prisma.account.createMany({
    data: accountsWithDefaults,
  });

  // Map transactions to include new audit fields with defaults
  const transactionsWithDefaults = backupData.transaction.map(
    (transaction: any) => ({
      ...transaction,
      createdById: transaction.createdById || null,
      updatedById: transaction.updatedById || null,
    })
  );

  await prisma.transaction.createMany({
    data: transactionsWithDefaults,
  });
}

seed()
  .then(() => {
    console.log("Data restored successfully.");
  })
  .catch((error) => {
    console.error("Error restoring data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
