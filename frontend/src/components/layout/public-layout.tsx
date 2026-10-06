import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './public-navbar'
import { PublicFooter } from './public-footer'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
