'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/auth/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { canVisit } from '@/auth/roles'

export default function CabinetLayout({ children }) {
  const { user, ready, homePath } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (ready && !user) router.replace('/login')
    if (ready && user && !canVisit(user.role, pathname)) router.replace(homePath)
  }, [ready, user, router, pathname, homePath])

  if (!ready || !user) return null
  if (!canVisit(user.role, pathname)) return null

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
