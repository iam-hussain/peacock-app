# Schema Migration Plan - Fintech Alignment

## 🎯 Objective
Modernize schema to fintech/banking standards with clear separation of concerns:
- **Account**: Identity + Access only
- **Transaction**: Financial source of truth
- **Summary**: Dashboard + Analytics data source
- **Passbook**: Legacy/transitional (read-only)

---

## 📊 Schema Changes

### New Enums
```prisma
AccountRole    → SUPER_ADMIN | ADMIN | MEMBER
AccountType    → MEMBER | VENDOR | CLUB | SYSTEM
AccountStatus  → ACTIVE | INACTIVE | BLOCKED | CLOSED
AccessLevel    → READ | WRITE | ADMIN
PassbookKind   → MEMBER | VENDOR | CLUB
```

### Account Model Changes

#### ✅ Added
- `type: AccountType` - Classification (replaces isMember)
- `role: AccountRole` - Organizational role
- `status: AccountStatus` - Account state
- `accessLevel: AccessLevel` - Single permission model
- `avatarUrl` - Renamed from avatar
- `startedAt` - Renamed from startAt
- `endedAt` - Renamed from endAt

#### ❌ Removed (Replaced)
- `isMember` → Use `type: AccountType`
- `readAccess` → Use `accessLevel`
- `writeAccess` → Use `accessLevel`
- `ROLE enum` → Use `AccountRole`

#### 🔄 Migration Map
| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `isMember: true` | `type: MEMBER` | Direct mapping |
| `isMember: false` | `type: VENDOR` | Direct mapping |
| `readAccess: true, writeAccess: false` | `accessLevel: READ` | Logic mapping |
| `readAccess: true, writeAccess: true` | `accessLevel: WRITE` | Logic mapping |
| `role: ADMIN` | `accessLevel: ADMIN` | Direct mapping |
| `role: SUPER_ADMIN` | `role: SUPER_ADMIN, accessLevel: ADMIN` | Keep both |

### Transaction Model Changes

#### ✅ Added
- `currency: String` - Currency code (default "INR")
- `occurredAt` - Renamed from transactionAt
- `postedAt` - When processed/confirmed
- `referenceId` - External reference
- `description` - Renamed from note
- `tags: String[]` - Categorization

#### 🔄 Renamed
- `transactionAt` → `occurredAt`
- `note` → `description`

### Passbook Model Changes

#### ✅ Marked as Legacy
- All fields kept for backward compatibility
- Add `@@map("passbooks")` for collection name
- Add deprecation comments
- **DO NOT USE FOR NEW FEATURES**

#### ✅ Added
- `currentBalance` - Snapshot value
- `totalDeposits` - Calculated total
- `totalWithdrawals` - Calculated total
- `version` - Version tracking
- `lastCalculatedAt` - Last calculation timestamp

### Summary Model - No Changes
✅ Already optimal - serves as dashboard source of truth

---

## 🔄 Data Migration Strategy

### Phase 1: Schema Update (Non-Breaking)
```bash
# Backup current database
mongodump --uri="$DATABASE_URL" --out=./backup

# Update schema with backward compatibility
npm run prisma:generate
```

### Phase 2: Data Transformation
```javascript
// Migration script: prisma/migrations/account-modernization.ts

async function migrateAccounts() {
  const accounts = await prisma.account.findMany()
  
  for (const account of accounts) {
    const updates = {
      // Type mapping
      type: account.isMember ? 'MEMBER' : 'VENDOR',
      
      // Access level mapping
      accessLevel: account.role === 'SUPER_ADMIN' || account.role === 'ADMIN' 
        ? 'ADMIN'
        : account.writeAccess 
          ? 'WRITE' 
          : 'READ',
      
      // Role mapping
      role: account.role, // Keep existing SUPER_ADMIN, ADMIN, or set MEMBER
      
      // Status mapping
      status: account.active ? 'ACTIVE' : 'INACTIVE',
      
      // Rename fields
      avatarUrl: account.avatar,
      startedAt: account.startAt,
      endedAt: account.endAt,
    }
    
    await prisma.account.update({
      where: { id: account.id },
      data: updates
    })
  }
}
```

### Phase 3: Code Update
Update all references systematically:
1. Authentication logic
2. Authorization checks
3. API routes
4. UI components
5. Queries and mutations

### Phase 4: Cleanup (After Verification)
```prisma
// Remove legacy fields from schema
- isMember
- readAccess  
- writeAccess
- ROLE enum (old one)
```

---

## 🔍 Code Changes Required

### 1. Authentication (`lib/core/auth.ts`)

#### Before:
```typescript
if (account.role === 'SUPER_ADMIN' || account.role === 'ADMIN')
if (account.writeAccess && account.role === 'ADMIN')
if (account.readAccess)
```

#### After:
```typescript
if (account.role === 'SUPER_ADMIN')
if (account.accessLevel === 'ADMIN')
if (account.accessLevel === 'WRITE' || account.accessLevel === 'ADMIN')
if (account.canLogin)
```

### 2. API Authorization

#### Before:
```typescript
const requireAdmin = () => {
  if (user.kind !== 'admin') throw new Error('Forbidden')
}

const requireWrite = () => {
  if (!user.writeAccess) throw new Error('Forbidden')
}
```

#### After:
```typescript
const requireAdmin = () => {
  if (user.accessLevel !== 'ADMIN') throw new Error('Forbidden')
}

const requireWrite = () => {
  if (user.accessLevel !== 'WRITE' && user.accessLevel !== 'ADMIN') {
    throw new Error('Forbidden')
  }
}
```

### 3. Queries

#### Before:
```typescript
prisma.account.findMany({
  where: { isMember: true }
})
```

#### After:
```typescript
prisma.account.findMany({
  where: { type: 'MEMBER' }
})
```

### 4. Dashboard APIs

#### ✅ New Endpoints:
```typescript
GET /api/dashboard/summary              // Latest
GET /api/dashboard/summary?month=YYYY-MM // Specific month
GET /api/dashboard/summary/range?from=2024-01&to=2024-12 // Range
```

#### ❌ Remove Runtime Calculations
- NO calculations in dashboard API
- Read directly from Summary table
- All values pre-calculated

### 5. UI Components

#### Before:
```typescript
{user.writeAccess && <Button>Edit</Button>}
{user.role === 'ADMIN' && <AdminPanel />}
```

#### After:
```typescript
{user.accessLevel === 'WRITE' || user.accessLevel === 'ADMIN' ? (
  <Button>Edit</Button>
) : null}
{user.accessLevel === 'ADMIN' && <AdminPanel />}
```

---

## ✅ Acceptance Criteria

### Schema
- [x] New enums defined
- [ ] Account model updated
- [ ] Transaction model updated
- [ ] Passbook marked legacy
- [ ] Summary unchanged

### Data
- [ ] All accounts migrated to new schema
- [ ] All transactions preserved
- [ ] Passbooks intact (legacy)
- [ ] No data loss

### Code
- [ ] No `isMember` usage
- [ ] No `readAccess` usage
- [ ] No `writeAccess` usage
- [ ] All checks use `type`, `accessLevel`, `canLogin`

### APIs
- [ ] Dashboard reads only from Summary
- [ ] No runtime calculations
- [ ] New summary endpoints working
- [ ] Legacy endpoints removed

### UI
- [ ] All components updated
- [ ] Permission checks use new model
- [ ] Analytics page created
- [ ] Graphs match dashboard values

### Testing
- [ ] Authentication works
- [ ] Authorization works
- [ ] Dashboard loads correctly
- [ ] Graphs display correctly
- [ ] No console errors
- [ ] Build successful

---

## 🚀 Deployment Plan

### Step 1: Preparation
```bash
# Backup database
mongodump --uri="$DATABASE_URL" --out=./backup-$(date +%Y%m%d)

# Create migration branch
git checkout -b feature/schema-modernization
```

### Step 2: Schema Update
```bash
# Update schema
cp prisma/schema-new.prisma prisma/schema.prisma

# Generate client
npm run prisma:generate
```

### Step 3: Data Migration
```bash
# Run migration script
npm run migrate:accounts
```

### Step 4: Code Updates
```bash
# Update all code references
# Test thoroughly
npm run build
npm run test
```

### Step 5: Deploy
```bash
# Commit changes
git add .
git commit -m "feat: modernize schema to fintech standards"

# Deploy with caution
npm run deploy
```

### Step 6: Verification
```bash
# Check dashboard
# Check analytics
# Check permissions
# Monitor errors
```

### Step 7: Cleanup (After 2 weeks)
```bash
# Remove legacy fields from schema
# Remove legacy code
# Update documentation
```

---

## ⚠️ Risks & Mitigations

### Risk: Data Loss
**Mitigation**: Full database backup before migration

### Risk: Breaking Authentication
**Mitigation**: Phased rollout, keep legacy fields during transition

### Risk: Permission Issues
**Mitigation**: Comprehensive testing of all permission scenarios

### Risk: Dashboard Downtime
**Mitigation**: Pre-calculate all summaries before deployment

---

## 📝 Rollback Plan

If issues occur:
```bash
# 1. Restore database from backup
mongorestore --uri="$DATABASE_URL" ./backup-YYYYMMDD

# 2. Revert code
git revert <commit-hash>

# 3. Redeploy previous version
npm run deploy

# 4. Investigate and fix
# 5. Retry migration
```

---

## 📚 Documentation Updates

### Update Files:
- [x] `SCHEMA_MIGRATION_PLAN.md` (this file)
- [ ] `AUTH_IMPLEMENTATION.md`
- [ ] `API_DOCUMENTATION.md`
- [ ] `DEVELOPER_GUIDE.md`
- [ ] `README.md`

### Update Code Comments:
- [ ] All deprecated functions
- [ ] All migration TODOs
- [ ] All new patterns

---

## 🎯 Success Metrics

### Performance
- Dashboard load time < 500ms
- No runtime calculations
- Cached summary data

### Code Quality
- Zero legacy flag usage
- Consistent naming
- Clear separation of concerns

### Maintainability
- Schema matches industry standards
- Easy to understand
- Self-documenting

### Reliability
- Auditable financial data
- Immutable transaction history
- Verified dashboard values

---

**Status**: Schema designed, migration plan ready  
**Next**: Begin Phase 1 - Schema Update  
**Owner**: Development Team  
**Timeline**: 2-3 days for full migration

