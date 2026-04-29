'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getOrders, getParents } from '@/lib/supabase/services'

export default function MyOrdersPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role === 'admin') {
      router.push('/dashboard')
      return
    }
    loadOrders()
  }, [profile, router])

  const loadOrders = async () => {
    try {
      if (!profile?.email) return
      
      const [parentsData] = await Promise.all([
        getParents(),
      ])
      
      const parent = parentsData.find(p => p.email === profile.email)
      if (!parent) {
        setLoading(false)
        return
      }

      const ordersData = await getOrders(parent.id)
      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
        <p className="text-gray-600">Historial de tus pedidos</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No tienes pedidos registrados. 
              <button
                onClick={() => router.push('/dashboard/new-order')}
                className="text-[#1a73e8] hover:underline ml-2"
              >
                Crear tu primer pedido
              </button>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Producto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cantidad</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Estado Pago</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Estado Entrega</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{order.customer_name}</td>
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
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
