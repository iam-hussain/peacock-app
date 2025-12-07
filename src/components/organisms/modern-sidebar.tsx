'use client'

import { useSelector, useDispatch } from 'react-redux'
import { usePathname, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderSync,
  Wallet,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { CustomLink } from '../ui/link'
import { RootState } from '@/store'
import { toggleSideBarCollapse, setIsLoggedIn } from '@/store/pageSlice'
import { clubAge } from '@/lib/date'
import { cn } from '@/lib/utils'
import fetcher from '@/lib/fetcher'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Members', href: '/dashboard/member' },
  { icon: Briefcase, label: 'Vendors', href: '/dashboard/vendor' },
  { icon: FolderSync, label: 'Loans', href: '/dashboard/loan' },
  { icon: Wallet, label: 'Transactions', href: '/dashboard/transaction' },
]

const secondaryNavItems: NavItem[] = [
  { icon: FileText, label: 'Terms & Conditions', href: '/dashboard/terms-and-conditions' },
]

export function ModernSidebar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const sideBarCollapsed = useSelector(
    (state: RootState) => state.page.sideBarCollapsed
  )
  const isLoggedIn = useSelector((state: RootState) => state.page.isLoggedIn)
  const club = clubAge()

  const logoutMutation = useMutation({
    mutationFn: () => fetcher.post('/api/auth/logout'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['authentication'] })
      dispatch(setIsLoggedIn(false))
      toast.success('Logged out successfully!')
      router.push('/login')
    },
    onError: (error: any) => {
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
    },
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen hidden lg:flex flex-col transition-all duration-300 ease-in-out',
        'bg-background/95 backdrop-blur-sm border-r border-border/50',
        'shadow-lg',
        sideBarCollapsed ? 'w-[80px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {!sideBarCollapsed && (
          <div className="flex items-center gap-3 flex-1">
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src="/peacock.svg"
                alt="Peacock Club"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">
                Peacock Club
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">
                {club.inYear}
              </p>
            </div>
          </div>
        )}
        {sideBarCollapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="relative h-8 w-8">
              <Image
                src="/peacock.svg"
                alt="Peacock Club"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => dispatch(toggleSideBarCollapse())}
        >
          {sideBarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <CustomLink
                key={item.href}
                href={item.href}
                variant="ghost"
                size="auto"
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  'active:scale-[0.98]',
                  active &&
                    'bg-primary/10 text-primary border-l-2 border-primary font-medium',
                  sideBarCollapsed && 'justify-center px-2'
                )}
                title={sideBarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
                {!sideBarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </CustomLink>
            )
          })}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {secondaryNavItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <CustomLink
                key={item.href}
                href={item.href}
                variant="ghost"
                size="auto"
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  'active:scale-[0.98]',
                  active &&
                    'bg-primary/10 text-primary border-l-2 border-primary font-medium',
                  sideBarCollapsed && 'justify-center px-2'
                )}
                title={sideBarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
                {!sideBarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </CustomLink>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Card */}
      {!sideBarCollapsed && (
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt="Admin" />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 border-t border-border/50 space-y-1">
        <Button
          variant="ghost"
          size="auto"
          className={cn(
            'w-full justify-start gap-3 px-3 py-2.5 rounded-lg',
            'hover:bg-accent hover:text-accent-foreground',
            sideBarCollapsed && 'justify-center px-2'
          )}
          title={sideBarCollapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!sideBarCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Button>
        {isLoggedIn && (
          <Button
            variant="ghost"
            size="auto"
            className={cn(
              'w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-destructive',
              'hover:bg-destructive/10 hover:text-destructive',
              sideBarCollapsed && 'justify-center px-2'
            )}
            title={sideBarCollapsed ? 'Logout' : undefined}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!sideBarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </Button>
        )}
      </div>
    </aside>
  )
}

