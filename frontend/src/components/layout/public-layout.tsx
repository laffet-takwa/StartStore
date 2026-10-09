import { Outlet } from 'react-router-dom'
import { Navbar as PublicNavbar } from './public-navbar'
import { PublicFooter } from './public-footer'
import { PageTransition } from '@/components/common/page-transition'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <PublicFooter />
    </div>
  )
}
