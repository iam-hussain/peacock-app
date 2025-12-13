import { useQuery } from '@tanstack/react-query'

import { fetchAuthStatus } from '@/lib/query-options'

export function useAuth() {
  const { data, isLoading } = useQuery(fetchAuthStatus())

  const user = data?.user || null
  const isLoggedIn = data?.isLoggedIn || false

  // Role checks
  const isSuperAdmin = user?.kind === 'admin' && user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.accessLevel === 'ADMIN'
  const isMember = user?.kind === 'member'

  // Permission checks using new accessLevel
  const canRead = isLoggedIn // All authenticated users can read
  const canWrite = user?.accessLevel === 'WRITE' || user?.accessLevel === 'ADMIN'
  const canManageAccounts = user?.accessLevel === 'ADMIN'
  const canManageTransactions = user?.accessLevel === 'WRITE' || user?.accessLevel === 'ADMIN'

  return {
    user,
    isLoggedIn,
    isLoading,
    
    // Role checks
    isSuperAdmin,
    isAdmin,
    isMember,
    
    // Permission checks (new schema)
    canRead,
    canWrite,
    canManageAccounts,
    canManageTransactions,
    
    // Access level (new)
    accessLevel: user?.accessLevel || null,
  }
}
