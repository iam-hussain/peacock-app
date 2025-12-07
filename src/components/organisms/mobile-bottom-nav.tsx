'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { LayoutDashboard, Users, FolderSync, MoreHorizontal } from 'lucide-react'

import { CustomLink } from '../ui/link'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { openSideBar } from '@/store/pageSlice'

interface BottomNavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  isMore?: boolean
}

const bottomNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Members', href: '/dashboard/member' },
  { icon: FolderSync, label: 'Loans', href: '/dashboard/loan' },
  { icon: MoreHorizontal, label: 'More', href: '#', isMore: true },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const dispatch = useDispatch()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (href === '#') return false
    return pathname.startsWith(href)
  }

  const handleMoreClick = () => {
    dispatch(openSideBar())
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          if (item.isMore) {
            return (
              <Button
                key="more"
                variant="ghost"
                size="auto"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg',
                  'transition-all active:scale-95',
                  'text-muted-foreground hover:text-foreground'
                )}
                onClick={handleMoreClick}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Button>
            )
          }
          return (
            <CustomLink
              key={item.href}
              href={item.href}
              variant="ghost"
              size="auto"
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg',
                'transition-all active:scale-95',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </CustomLink>
          )
        })}
      </div>
    </nav>
  )
}

