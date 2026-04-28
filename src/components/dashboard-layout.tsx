'use client'

import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { Footer } from '@/components/footer'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!user || !profile) {
    return null
  }

  const isAdmin = profile.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = isAdmin
    ? [
        { label: 'Dashboard', href: '/dashboard', icon: 'fa-chart-line' },
        { label: 'Entregas', href: '/dashboard/deliveries', icon: 'fa-truck' },
        { label: 'Padres', href: '/dashboard/parents', icon: 'fa-user-friends' },
        { label: 'Campañas', href: '/dashboard/campaigns', icon: 'fa-folder-open' },
      ]
    : [
        { label: 'Nuevo Pedido', href: '/dashboard/new-order', icon: 'fa-plus-circle' },
        { label: 'Mis Pedidos', href: '/dashboard/my-orders', icon: 'fa-clipboard-list' },
      ]

  return (
    <div className="app-container">
      {/* Tabs modernos */}
      <div className="tabs-modern">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`tab-btn ${pathname === item.href ? 'active' : ''}`}
          >
            <i className={`fas ${item.icon}`}></i>
            {item.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="panel">
        {/* Header */}
        <div className="flex-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#1c4e7a]">App Minibasquet Hindú Club</h1>
            <p className="text-xs text-[#5f7f9e]">{profile.name} ({isAdmin ? 'Admin' : 'Padre'})</p>
          </div>
          <Button variant="outline" size="sm" icon="fa-sign-out-alt" onClick={handleSignOut}>
            Salir
          </Button>
        </div>

        {/* Main Content */}
        {children}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
