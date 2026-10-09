import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNavbar } from '@/components/layout/top-navbar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { AccessibilityManager } from '@/components/common/accessibility-manager'
import { Toaster } from 'sonner'
import { PageTransition } from '@/components/common/page-transition'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg">
        Skip to main content
      </a>

      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onToggleSidebar={() => setSidebarCollapsed((c) => !c)} />

        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6" role="main">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <MobileBottomNav />
      <AccessibilityManager />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}