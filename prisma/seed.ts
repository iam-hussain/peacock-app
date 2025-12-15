import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import path from "path"

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})

const toDate = (value: any) => (value ? new Date(value) : null)

const buildDefaultClubPassbook = () => ({
  kind: "CLUB",
  payload: {
    totalMemberPeriodicDeposits: 0,
    totalMemberOffsetDeposits: 0,
    totalMemberWithdrawals: 0,
    totalMemberProfitWithdrawals: 0,
    currentClubBalance: 0,
    netClubBalance: 0,
    totalInvestment: 0,
    totalReturns: 0,
    totalProfit: 0,
    totalLoanTaken: 0,
    totalLoanRepay: 0,
    totalLoanBalance: 0,
    totalInterestPaid: 0,
    totalVendorProfit: 0,
  },
  loanHistory: [],
  currentBalance: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  joiningOffset: 0,
  delayOffset: 0,
  meta: null,
  version: 0,
  lastCalculatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
})

async function seed() {
  console.log("🌱 Starting database seed...\n")

  const backupFilePath = path.join(
    process.cwd(),
    "public",
    "peacock_backup.json"
  )

  console.log(`📂 Reading backup from: ${backupFilePath}`)
  const backupData = JSON.parse(readFileSync(backupFilePath, "utf8"))

  console.log(`📊 Backup contains:`)
  console.log(`   - ${backupData.account?.length || 0} accounts`)
  console.log(`   - ${backupData.transaction?.length || 0} transactions`)
  console.log(`   - ${backupData.passbook?.length || 0} passbooks\n`)

  // Clear existing data (order matters due to foreign key constraints)
  console.log("🗑️  Clearing existing data...")
  // 1. Delete transactions first (no dependencies)
  await prisma.transaction.deleteMany()
  // 2. Delete summaries
  await prisma.summary.deleteMany()
  // 3. Delete passbooks (after accounts are deleted)
  await prisma.passbook.deleteMany()
  // 4. Delete accounts (this will automatically clear passbookId references)
  await prisma.account.deleteMany()
  console.log("✅ Cleared all existing data\n")

  // Transform and insert passbooks first
  console.log("📚 Transforming and seeding passbooks...")
  const passbooksWithDefaults = backupData.passbook.map((passbook: any) => {
    const { createdAt, updatedAt, lastCalculatedAt, ...passbookBase } =
      passbook
    return {
      ...passbookBase,
      // Ensure kind is set (already in new format)
      kind: passbook.kind || passbook.type || "MEMBER",
      createdAt: toDate(createdAt) ?? new Date(),
      updatedAt: toDate(updatedAt) ?? new Date(),
      lastCalculatedAt: toDate(lastCalculatedAt),
      // Ensure defaults for optional fields
      currentBalance: passbook.currentBalance ?? 0,
      totalDeposits: passbook.totalDeposits ?? 0,
      totalWithdrawals: passbook.totalWithdrawals ?? 0,
      joiningOffset: passbook.joiningOffset ?? 0,
      delayOffset: passbook.delayOffset ?? 0,
      meta: passbook.meta ?? null,
      version: passbook.version ?? 0,
      isChit: passbook.isChit ?? true,
      payload: passbook.payload ?? {},
      loanHistory: passbook.loanHistory ?? [],
    }
  })
  const hasClubPassbook = passbooksWithDefaults.some(
    (p: any) => p.kind === "CLUB"
  )
  if (!hasClubPassbook) {
    passbooksWithDefaults.push(buildDefaultClubPassbook())
  }
  await prisma.passbook.createMany({ data: passbooksWithDefaults })
  console.log(`✅ Created ${passbooksWithDefaults.length} passbooks\n`)

  // Transform accounts (already in new schema format)
  console.log("👥 Transforming accounts...")
  const accountsWithDefaults = backupData.account.map((account: any) => {
    const {
      createdAt,
      updatedAt,
      lastLoginAt,
      startedAt,
      endedAt,
      accessUpdatedAt,
      ...accountBase
    } = account

    return {
      ...accountBase,
      // Ensure required fields have defaults
      type: account.type || "MEMBER",
      role: account.role || "MEMBER",
      status: account.status || (account.active === false ? "INACTIVE" : "ACTIVE"),
      accessLevel: account.accessLevel || "READ",
      canLogin: account.canLogin ?? false,
      // Handle dates
      createdAt: toDate(createdAt) ?? new Date(),
      updatedAt: toDate(updatedAt) ?? new Date(),
      lastLoginAt: toDate(lastLoginAt),
      startedAt: toDate(startedAt) ?? new Date(),
      endedAt: toDate(endedAt),
      accessUpdatedAt: toDate(accessUpdatedAt),
      // Ensure optional fields
      passwordHash: account.passwordHash || null,
      email: account.email || null,
      phone: account.phone || null,
      avatarUrl: account.avatarUrl || null,
      accessUpdatedById: account.accessUpdatedById || null,
    }
  })

  console.log(`📝 Account type distribution:`)
  const typeCount = accountsWithDefaults.reduce((acc: any, a: any) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`)
  })

  console.log(`🔐 Access level distribution:`)
  const accessCount = accountsWithDefaults.reduce((acc: any, a: any) => {
    acc[a.accessLevel] = (acc[a.accessLevel] || 0) + 1
    return acc
  }, {})
  Object.entries(accessCount).forEach(([level, count]) => {
    console.log(`   - ${level}: ${count}`)
  })

  await prisma.account.createMany({
    data: accountsWithDefaults,
  })
  console.log(`✅ Created ${accountsWithDefaults.length} accounts\n`)

  // Transform transactions (already in new schema format)
  console.log("💸 Seeding transactions...")
  const transactionsWithDefaults = backupData.transaction.map(
    (transaction: any) => {
      const { createdAt, updatedAt, occurredAt, postedAt, ...transactionBase } =
        transaction

      return {
        ...transactionBase,
        // Ensure required fields have defaults
        type: transaction.type || "PERIODIC_DEPOSIT",
        method: transaction.method || "ACCOUNT",
        currency: transaction.currency || "INR",
        // Handle dates
        occurredAt: toDate(occurredAt) ?? new Date(),
        postedAt: toDate(postedAt),
        createdAt: toDate(createdAt) ?? new Date(),
        updatedAt: toDate(updatedAt) ?? new Date(),
        // Ensure optional fields
        description: transaction.description || null,
        referenceId: transaction.referenceId || null,
        tags: transaction.tags || [],
        createdById: transaction.createdById || null,
        updatedById: transaction.updatedById || null,
      }
    }
  )

  await prisma.transaction.createMany({
    data: transactionsWithDefaults,
  })
  console.log(`✅ Created ${transactionsWithDefaults.length} transactions\n`)

  // Summary statistics
  console.log("📊 Seed Summary:")
  const finalCounts = await Promise.all([
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.passbook.count(),
  ])
  console.log(`   - Accounts: ${finalCounts[0]}`)
  console.log(`   - Transactions: ${finalCounts[1]}`)
  console.log(`   - Passbooks: ${finalCounts[2]}`)

  const superAdmins = await prisma.account.count({
    where: { role: "SUPER_ADMIN" },
  })
  console.log(`   - Super Admins: ${superAdmins}`)

  console.log("\n✨ Database seeded successfully!")
}

seed()
  .then(() => {
    console.log("\n🎉 Seed completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
