'use client'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import SideMenu from '@/components/organisms/side-menu'
import SideMenuMobile from '@/components/organisms/side-menu-mobile'
import TopMenu from '@/components/organisms/top-menu'
import { fetchAuthStatus } from '@/lib/query-options'
import { setIsLoggedIn } from '@/store/pageSlice'
import { RootState } from '@/store'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const dispatch = useDispatch()
  const { data, isLoading, isError } = useQuery(fetchAuthStatus())
  const sideBarCollapsed = useSelector(
    (state: RootState) => state.page.sideBarCollapsed
  )

  useEffect(() => {
    if (data) {
      dispatch(setIsLoggedIn(data.isLoggedIn))
    }

    if (isError) {
      dispatch(setIsLoggedIn(false))
    }
  }, [data, isError, isLoading, dispatch])

  return (
    <div className="main-wrapper">
      <main className={'page-main bg-paper'}>
        <TopMenu className="fixed z-30 block w-full bg-background" />
        <SideMenu />
        <div
          className={cn(
            'h-full min-h-svh w-full transition-all duration-300 max-w-screen-3xl m-auto mt-0 pt-[48px]',
            sideBarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[300px]'
          )}
          id="dashboard-content"
        >
          <div className="w-full flex h-full p-6">{children}</div>
        </div>
      </main>
      <SideMenuMobile />
    </div>
  )
}
