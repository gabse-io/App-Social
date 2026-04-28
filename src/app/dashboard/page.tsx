'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getOrderStats, getOrders } from '@/lib/supabase/services'

export default function DashboardPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard/new-order')
      return
    }
    loadData()
  }, [profile, router])

  const loadData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        getOrderStats(),
        getOrders(),
      ])
      setStats(statsData)
      setRecentOrders(ordersData.slice(0, 10))
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <i className="fas fa-shopping-cart stat-icon"></i>
          <div className="stat-number">{stats?.totalOrders || 0}</div>
          <div className="stat-label">Pedidos</div>
        </div>
        <div className="stat-card">
          <i className="fas fa-boxes stat-icon"></i>
          <div className="stat-number">{stats?.totalProducts || 0}</div>
          <div className="stat-label">Productos</div>
        </div>
        <div className="stat-card">
          <i className="fas fa-dollar-sign stat-icon"></i>
          <div className="stat-number">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Recaudado</div>
        </div>
        <div className="stat-card">
          <i className="fas fa-truck stat-icon"></i>
          <div className="stat-number">{stats?.pendingDeliveries || 0}</div>
          <div className="stat-label">Pendientes</div>
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle><i className="fas fa-clipboard-list mr-2"></i>Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ecf3fa]">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-[#1c4e7a]">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-[#1c4e7a]">Producto</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-[#1c4e7a]">Cantidad</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-[#1c4e7a]">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-[#1c4e7a]">Pago</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-[#1c4e7a]">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#5f7f9e]">
                      No hay pedidos registrados
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#ecf3fa] hover:bg-[#f8fbfe]">
                      <td className="py-3 px-4 text-sm">{order.customer_name}</td>
                      <td className="py-3 px-4 text-sm">{order.product_name}</td>
                      <td className="py-3 px-4 text-sm">{order.quantity}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        ${(order.price * order.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={order.payment_status === 'paid' ? 'paid' : 'unpaid'}>
                          {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={order.delivery_status === 'delivered' ? 'delivered' : 'pending'}>
                          {order.delivery_status === 'delivered' ? 'Entregado' : 'Pendiente'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
