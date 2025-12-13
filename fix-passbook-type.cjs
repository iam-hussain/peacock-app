const fs = require('fs')
const path = require('path')

const replacements = [
  // Fix passbook.type references to passbook.kind
  { from: /passbook\.type\s*===\s*"CLUB"/g, to: 'passbook.kind === "CLUB"' },
  { from: /passbook\.type\s*===\s*"VENDOR"/g, to: 'passbook.kind === "VENDOR"' },
  { from: /passbook\.type\s*===\s*"MEMBER"/g, to: 'passbook.kind === "MEMBER"' },
  { from: /passbook\.type\s*!==\s*"CLUB"/g, to: 'passbook.kind !== "CLUB"' },
  { from: /passbook\.type\s*!==\s*"VENDOR"/g, to: 'passbook.kind !== "VENDOR"' },
  { from: /passbook\.type\s*!==\s*"MEMBER"/g, to: 'passbook.kind !== "MEMBER"' },
  { from: /\.type\s*===\s*"CLUB"/g, to: '.kind === "CLUB"' },
  { from: /\.type\s*===\s*"VENDOR"/g, to: '.kind === "VENDOR"' },
  { from: /\.type\s*===\s*"MEMBER"/g, to: '.kind === "MEMBER"' },
  { from: /\.type\s*!==\s*"CLUB"/g, to: '.kind !== "CLUB"' },
  { from: /\.type\s*!==\s*"VENDOR"/g, to: '.kind !== "VENDOR"' },
  { from: /\.type\s*!==\s*"MEMBER"/g, to: '.kind !== "MEMBER"' },
]

let filesUpdated = 0

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    replacements.forEach(({ from, to }) => {
      if (content.match(from)) {
        content = content.replace(from, to)
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, 'utf8')
      filesUpdated++
      console.log(`✓ ${filePath}`)
    }
  } catch (error) {
    console.error(`✗ ${filePath}:`, error.message)
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== '.next') {
      walkDir(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFile(filePath)
    }
  })
}

console.log('🔧 Fixing passbook.type → passbook.kind...\n')
walkDir(path.join(__dirname, 'src'))
console.log(`\n✨ Fixed ${filesUpdated} files`)

