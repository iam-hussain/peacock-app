import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import path from 'path'

import { generateVendorUsername } from '../src/lib/helper'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

/**
 * Maps legacy account data to new schema
 * Old schema: isMember, readAccess, writeAccess, role
 * New schema: type, accessLevel, role, status
 */
function mapAccountToNewSchema(account: any) {
  // Determine AccountType based on isMember
  const type = account.isMember === false ? 'VENDOR' : 'MEMBER'

  // Determine AccessLevel based on role and access flags
  let accessLevel: 'READ' | 'WRITE' | 'ADMIN'
  if (account.role === 'SUPER_ADMIN' || account.role === 'ADMIN') {
    accessLevel = 'ADMIN'
  } else if (account.writeAccess || account.canWrite) {
    accessLevel = 'WRITE'
  } else {
    accessLevel = 'READ'
  }

  // Determine AccountRole
  let role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'
  if (account.role === 'SUPER_ADMIN') {
    role = 'SUPER_ADMIN'
  } else if (account.role === 'ADMIN') {
    role = 'ADMIN'
  } else {
    role = 'MEMBER'
  }

  // Determine AccountStatus
  const status = account.active === false ? 'INACTIVE' : 'ACTIVE'

  // Determine canLogin
  const canLogin = Boolean(
    account.canLogin ?? 
    (account.passwordHash && (account.readAccess || account.writeAccess || account.role === 'ADMIN' || account.role === 'SUPER_ADMIN'))
  )

  return {
    type,
    accessLevel,
    role,
    status,
    canLogin,
  }
}

/**
 * Generates unique username for account
 */
function generateUniqueUsername(
  account: any,
  usedUsernames: Set<string>
): string {
  // Determine username: use existing username, or slug (for backward compatibility), or generate for vendors
  let username: string

  if (account.username) {
    username = account.username
  } else if (account.slug) {
    // For backward compatibility, use slug as username
    username = account.slug
  } else if (account.isMember === false) {
    // Vendor: generate username
    username = generateVendorUsername(account.firstName, account.lastName)
  } else {
    // Member without username or slug: use a generated one based on name
    const name = [account.firstName, account.lastName]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    username = name || `member-${account.id}`
  }

  // Ensure username is unique
  let finalUsername = username
  let counter = 1
  while (usedUsernames.has(finalUsername)) {
    finalUsername = `${username}_${counter}`
    counter++
  }
  usedUsernames.add(finalUsername)

  return finalUsername
}

async function seed() {
  console.log('🌱 Starting database seed...\n')

  const backupFilePath = path.join(
    process.cwd(),
    'public',
    'peacock_backup.json'
  )
  
  console.log(`📂 Reading backup from: ${backupFilePath}`)
  const backupData = JSON.parse(readFileSync(backupFilePath, 'utf8'))

  console.log(`📊 Backup contains:`)
  console.log(`   - ${backupData.account?.length || 0} accounts`)
  console.log(`   - ${backupData.transaction?.length || 0} transactions`)
  console.log(`   - ${backupData.passbook?.length || 0} passbooks\n`)

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.transaction.deleteMany()
  await prisma.account.deleteMany()
  await prisma.passbook.deleteMany()
  await prisma.summary.deleteMany()
  console.log('✅ Cleared all existing data\n')

  // Transform and insert passbooks first
  console.log('📚 Transforming and seeding passbooks...')
  const passbooksWithNewSchema = backupData.passbook.map((passbook: any) => {
    const { type, ...passbookBase } = passbook
    return {
      ...passbookBase,
      kind: type, // Rename type → kind
      // Add new fields with defaults
      currentBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      meta: null,
      version: 0,
      lastCalculatedAt: null,
    }
  })
  await prisma.passbook.createMany({ data: passbooksWithNewSchema })
  console.log(`✅ Created ${passbooksWithNewSchema.length} passbooks\n`)

  // Track usernames to ensure uniqueness
  const usedUsernames = new Set<string>()

  // Map accounts to new schema
  console.log('👥 Transforming accounts to new schema...')
  const accountsWithNewSchema = backupData.account.map((account: any) => {
    const username = generateUniqueUsername(account, usedUsernames)
    const newSchemaFields = mapAccountToNewSchema(account)

    // Destructure to exclude legacy/unwanted fields
    const {
      slug,
      isMember,
      readAccess,
      writeAccess,
      canRead,
      canWrite,
      avatar,
      startAt,
      endAt,
      ...accountBase
    } = account

    return {
      ...accountBase,
      username,
      passwordHash: account.passwordHash || null,
      lastLoginAt: account.lastLoginAt || null,
      
      // New schema fields
      ...newSchemaFields,
      
      // Renamed fields
      avatarUrl: avatar || null,
      startedAt: startAt || new Date(),
      endedAt: endAt || null,
    }
  })

  console.log(`📝 Account type distribution:`)
  const typeCount = accountsWithNewSchema.reduce((acc: any, a: any) => {
    acc[a.type] = (acc[a.type] || 0) + 1
    return acc
  }, {})
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`)
  })

  console.log(`🔐 Access level distribution:`)
  const accessCount = accountsWithNewSchema.reduce((acc: any, a: any) => {
    acc[a.accessLevel] = (acc[a.accessLevel] || 0) + 1
    return acc
  }, {})
  Object.entries(accessCount).forEach(([level, count]) => {
    console.log(`   - ${level}: ${count}`)
  })

  await prisma.account.createMany({
    data: accountsWithNewSchema,
  })
  console.log(`✅ Created ${accountsWithNewSchema.length} accounts\n`)

  // Map transactions to include new fields with defaults
  console.log('💸 Seeding transactions...')
  const transactionsWithDefaults = backupData.transaction.map(
    (transaction: any) => {
      const {
        transactionAt,
        note,
        ...transactionBase
      } = transaction

      return {
        ...transactionBase,
        createdById: transaction.createdById || null,
        updatedById: transaction.updatedById || null,
        
        // New/renamed fields
        occurredAt: transactionAt || new Date(),
        description: note || null,
        currency: 'INR',
        tags: [],
        referenceId: null,
        postedAt: null,
      }
    }
  )

  await prisma.transaction.createMany({
    data: transactionsWithDefaults,
  })
  console.log(`✅ Created ${transactionsWithDefaults.length} transactions\n`)

  // Summary statistics
  console.log('📊 Seed Summary:')
  const finalCounts = await Promise.all([
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.passbook.count(),
  ])
  console.log(`   - Accounts: ${finalCounts[0]}`)
  console.log(`   - Transactions: ${finalCounts[1]}`)
  console.log(`   - Passbooks: ${finalCounts[2]}`)
  
  const superAdmins = await prisma.account.count({
    where: { role: 'SUPER_ADMIN' }
  })
  console.log(`   - Super Admins: ${superAdmins}`)
  
  console.log('\n✨ Database seeded successfully!')
}

seed()
  .then(() => {
    console.log('\n🎉 Seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
