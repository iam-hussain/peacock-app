const fs = require('fs')
const path = require('path')

const replacements = [
  // Fix ALL transactionAt references to occurredAt
  { from: /\.transactionAt/g, to: '.occurredAt' },
  { from: /transactionAt:/g, to: 'occurredAt:' },
  { from: /'transactionAt'/g, to: "'occurredAt'" },
  { from: /"transactionAt"/g, to: '"occurredAt"' },
  
  // Fix passbook.type references to passbook.kind (where passbook is an object)
  { from: /passbook\.type/g, to: 'passbook.kind' },
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
      fs.writeFileSync(filePath, 'utf8')
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

console.log('🔧 Fixing remaining field names...\n')
walkDir(path.join(__dirname, 'src'))
console.log(`\n✨ Complete!`)
console.log(`📊 Files updated: ${filesUpdated}`)
console.log(`🔄 Total changes: ${changesCount}`)

