const fs = require('fs')
const path = require('path')

const replacements = [
  // Update enum names to match new schema
  { from: /PASSBOOK_TYPE/g, to: 'PassbookKind' },
  { from: /TRANSACTION_TYPE/g, to: 'TransactionType' },
  { from: /TRANSACTION_METHOD/g, to: 'TransactionMethod' },
  { from: /\bROLE\b(?!\.)/g, to: 'AccountRole' }, // ROLE enum → AccountRole (but not ROLE.ADMIN)
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
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        walkDir(filePath)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFile(filePath)
    }
  })
}

console.log('🔧 Updating enum names...\n')
walkDir(path.join(__dirname, 'src'))
console.log(`\n✨ Enum names updated!`)
console.log(`📊 Files updated: ${filesUpdated}`)
console.log(`🔄 Total changes: ${changesCount}`)

