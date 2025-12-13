const fs = require('fs')
const path = require('path')

/**
 * Fix field name changes in Prisma queries
 * - Passbook: type → kind
 * - Transaction: transactionAt → occurredAt
 * - Account: avatar → avatarUrl (but keep @map so both work)
 */

const replacements = [
  // Passbook type → kind
  { 
    from: /type:\s*"CLUB"/g, 
    to: 'kind: "CLUB"' 
  },
  { 
    from: /type:\s*"VENDOR"/g, 
    to: 'kind: "VENDOR"' 
  },
  { 
    from: /type:\s*"MEMBER"/g, 
    to: 'kind: "MEMBER"' 
  },
  { 
    from: /type:\s*{\s*in:\s*\["CLUB",\s*"VENDOR"\]\s*}/g, 
    to: 'kind: { in: ["CLUB", "VENDOR"] }' 
  },
  
  // Transaction transactionAt → occurredAt in orderBy
  { 
    from: /orderBy:\s*{\s*transactionAt:/g, 
    to: 'orderBy: { occurredAt:' 
  },
  { 
    from: /sortField:\s*['"]transactionAt['"]/g, 
    to: "sortField: 'occurredAt'" 
  },
  
  // Transaction transactionAt → occurredAt in where clauses
  { 
    from: /transactionAt:\s*{\s*gte:/g, 
    to: 'occurredAt: { gte:' 
  },
  { 
    from: /transactionAt:\s*{\s*lte:/g, 
    to: 'occurredAt: { lte:' 
  },
  
  // Transaction transactionAt in select
  { 
    from: /transactionAt:\s*true/g, 
    to: 'occurredAt: true' 
  },
  
  // Account avatar references in select (need to use avatarUrl for new schema)
  // But we have @map so avatar still works - just add avatarUrl as option
]

let filesUpdated = 0
let changesCount = 0

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    let fileChanges = 0
    
    replacements.forEach(({ from, to }) => {
      const matches = content.match(from)
      if (matches) {
        content = content.replace(from, to)
        modified = true
        fileChanges += matches.length
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      filesUpdated++
      changesCount += fileChanges
      console.log(`✓ Updated: ${filePath} (${fileChanges} changes)`)
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message)
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'dist') {
        walkDir(filePath)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFile(filePath)
    }
  })
}

console.log('🔧 Fixing schema field names...\n')

// Start from src directory
walkDir(path.join(__dirname, 'src'))
walkDir(path.join(__dirname, 'prisma'))

console.log(`\n✨ Field names updated!`)
console.log(`📊 Files updated: ${filesUpdated}`)
console.log(`🔄 Total changes: ${changesCount}`)

