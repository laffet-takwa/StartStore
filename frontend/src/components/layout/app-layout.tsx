import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNavbar } from '@/components/layout/top-navbar'
import { AccessibilityManager } from '@/components/common/accessibility-manager'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={collapsed ? 'app col' : 'app'}>
      <a
        href="#view"
        className="btn"
        style={{ position: 'absolute', left: -9999, top: 8, zIndex: 100 }}
        onFocus={(e) => (e.currentTarget.style.left = '8px')}
        onBlur={(e) => (e.currentTarget.style.left = '-9999px')}
      >
        Skip to content
      </a>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <main>
        <TopNavbar onToggleSidebar={() => setCollapsed((c) => !c)} />
        <section id="view">
          <Outlet />
        </section>
      </main>

      <AccessibilityManager />
    </div>
  )
}
