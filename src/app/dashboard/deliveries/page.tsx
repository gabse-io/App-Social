'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { searchOrdersByCustomer, getOrders, updateOrderStatus } from '@/lib/supabase/services'

export default function DeliveriesPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
  }, [profile, router])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      handleSearch()
    } else {
      setFilteredOrders([])
    }
  }, [searchTerm])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const results = await searchOrdersByCustomer(searchTerm)
      setFilteredOrders(results)
    } catch (error) {
      console.error('Error searching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'paid', undefined)
      handleSearch()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error al actualizar pedido')
    }
  }

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, undefined, 'delivered')
      handleSearch()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error al actualizar pedido')
    }
  }

  const handleMarkAllPaid = async () => {
    if (!confirm('¿Marcar todos como pagados?')) return
    try {
      for (const order of filteredOrders) {
        if (order.payment_status === 'pending') {
          await updateOrderStatus(order.id, 'paid', undefined)
        }
      }
      handleSearch()
    } catch (error) {
      console.error('Error updating orders:', error)
      alert('Error al actualizar pedidos')
    }
  }

  const handleMarkAllDelivered = async () => {
    if (!confirm('¿Marcar todos como entregados?')) return
    try {
      for (const order of filteredOrders) {
        if (order.delivery_status === 'pending') {
          await updateOrderStatus(order.id, undefined, 'delivered')
        }
      }
      handleSearch()
    } catch (error) {
      console.error('Error updating orders:', error)
      alert('Error al actualizar pedidos')
    }
  }

  // Group orders by customer
  const groupedOrders = filteredOrders.reduce((acc: Record<string, any[]>, order) => {
    const customerName = order.customer_name
    if (!acc[customerName]) {
      acc[customerName] = []
    }
    acc[customerName].push(order)
    return acc
  }, {} as Record<string, any[]>)

  const pendingDeliveries = Object.entries(groupedOrders).filter(([_, orders]: [string, any[]]) =>
    orders.some((o: any) => o.delivery_status === 'pending')
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Entregas</h1>
        <p className="text-gray-600">Buscar y gestionar entregas por cliente</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre del cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searchTerm.length < 2}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a73e8]"></div>
        </div>
      )}

      {filteredOrders.length > 0 && (
        <>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleMarkAllPaid}>
              Marcar todos como pagados
            </Button>
            <Button variant="secondary" onClick={handleMarkAllDelivered}>
              Marcar todos como entregados
            </Button>
          </div>

          {Object.entries(groupedOrders).map(([customerName, customerOrders]: [string, any[]]) => (
            <Card key={customerName}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{customerName}</span>
                  <Badge variant={customerOrders.some((o: any) => o.delivery_status === 'pending') ? 'warning' : 'success'}>
                    {customerOrders.some((o: any) => o.delivery_status === 'pending') ? 'Pendiente' : 'Completado'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerOrders.map((order: any) => (
                    <div key={order.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{order.product_name}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {order.quantity} | Total: ${(order.price * order.quantity).toFixed(2)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                            {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                          <Badge variant={order.delivery_status === 'delivered' ? 'success' : 'warning'}>
                            {order.delivery_status === 'delivered' ? 'Entregado' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {order.payment_status === 'pending' && (
                          <Button size="sm" onClick={() => handleMarkPaid(order.id)}>
                            Pagar
                          </Button>
                        )}
                        {order.delivery_status === 'pending' && (
                          <Button size="sm" onClick={() => handleMarkDelivered(order.id)}>
                            Entregar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {searchTerm.length >= 2 && !loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 py-8">No se encontraron pedidos para "{searchTerm}"</p>
          </CardContent>
        </Card>
      )}

      {pendingDeliveries.length > 0 && searchTerm.length < 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingDeliveries.map(([customerName, orders]: [string, any[]]) => (
                <div key={customerName} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <span className="font-medium">{customerName}</span>
                  <Badge variant="warning">
                    {orders.filter((o: any) => o.delivery_status === 'pending').length} pendientes
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
