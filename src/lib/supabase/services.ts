import { supabase } from './client'
import { Parent, Project, Product, ProjectParent, Order, PaymentStatus, DeliveryStatus } from '@/types'

// Parents
export async function getParents() {
  // Obtener padres con conteo de pedidos
  const { data: parents, error } = await supabase
    .from('parents')
    .select('*')
    .order('name')
  
  if (error) throw error
  
  // Para cada padre, contar sus pedidos
  const parentsWithOrderCount = await Promise.all(
    (parents || []).map(async (parent) => {
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', parent.id)
      
      if (countError) {
        console.error('Error contando pedidos para padre', parent.id, countError)
      }
      
      return {
        ...parent,
        order_count: count || 0
      }
    })
  )
  
  return parentsWithOrderCount
}

// Profiles (todos los usuarios)
export async function getProfiles() {
  // Obtener todos los perfiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name')
  
  if (error) throw error
  
  // Para cada perfil, obtener datos adicionales si también es padre
  const profilesWithParentData = await Promise.all(
    (profiles || []).map(async (profile) => {
      // Buscar si el usuario también existe en la tabla parents
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .eq('email', profile.email)
        .maybeSingle()
      
      if (parentError) {
        console.error('Error buscando padre para', profile.email, parentError)
      }
      
      // Contar pedidos del padre
      let orderCount = 0
      if (parent) {
        const { count, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', parent.id)
        
        if (!countError) {
          orderCount = count || 0
        }
      }
      
      return {
        ...profile,
        is_parent: !!parent,
        is_active: profile.role === 'admin' 
          ? (parent?.is_active ?? true) // Admin puede estar inactivo como padre
          : (parent?.is_active ?? true), // Padre normal
        phone: parent?.phone || profile.phone,
        order_count: orderCount,
        parent_id: parent?.id
      }
    })
  )
  
  return profilesWithParentData
}

// Toggle user status (solo para padres)
export async function toggleUserStatus(profileId: string, isActive: boolean) {
  // Buscar el padre por email usando el perfil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', profileId)
    .single()
  
  if (profileError) throw profileError
  if (!profile) throw new Error('Perfil no encontrado')
  
  // Actualizar el estado en la tabla parents
  const { error } = await supabase
    .from('parents')
    .update({ is_active: isActive })
    .eq('email', profile.email)
  
  if (error) throw error
}

export async function getParent(id: string) {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createParent(name: string, email?: string, phone?: string) {
  // Insert sin .select() para evitar problemas de RLS en el SELECT post-INSERT
  const { error } = await supabase
    .from('parents')
    .insert({ name, email, phone, is_active: true })
  
  if (error) throw error
  
  // Buscar el padre recién creado por email (más confiable)
  const { data, error: fetchError } = await supabase
    .from('parents')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (fetchError) {
    console.warn('Advertencia: No se pudo recuperar el padre creado, pero fue insertado:', fetchError)
    // Retornar un objeto mínimo con los datos que tenemos
    return { id: 'unknown', name, email, phone, is_active: true, created_at: new Date().toISOString() }
  }
  
  return data || { id: 'unknown', name, email, phone, is_active: true, created_at: new Date().toISOString() }
}

export async function updateParent(id: string, name: string, email?: string, phone?: string) {
  const { data, error } = await supabase
    .from('parents')
    .update({ name, email, phone })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleParentStatus(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('parents')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteParent(id: string) {
  // First, delete all orders for this parent
  await supabase.from('orders').delete().eq('parent_id', id)
  
  // Then, remove from project_parents
  await supabase.from('project_parents').delete().eq('parent_id', id)
  
  // Finally, delete the parent
  const { error } = await supabase.from('parents').delete().eq('id', id)
  if (error) throw error
}

// Projects
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, products(*), project_parents(parent_id)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, products(*), project_parents(parent_id)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getProjectsForParent(parentEmail: string) {
  const { data: parent } = await supabase
    .from('parents')
    .select('id')
    .eq('email', parentEmail)
    .single()
  
  if (!parent) return []

  const { data, error } = await supabase
    .from('project_parents')
    .select('project_id, projects(*, products(*))')
    .eq('parent_id', parent.id)
  if (error) throw error
  
  return data.map((item: any) => item.projects)
}

export async function createProject(name: string, description?: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id: string, name: string, description?: string) {
  const { data, error } = await supabase
    .from('projects')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// Products
export async function createProduct(projectId: string, name: string, price: number) {
  const { data, error } = await supabase
    .from('products')
    .insert({ project_id: projectId, name, price })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, name: string, price: number) {
  const { data, error } = await supabase
    .from('products')
    .update({ name, price })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// Project Parents
export async function addParentToProject(projectId: string, parentId: string) {
  const { data, error } = await supabase
    .from('project_parents')
    .insert({ project_id: projectId, parent_id: parentId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeParentFromProject(projectId: string, parentId: string) {
  const { error } = await supabase
    .from('project_parents')
    .delete()
    .eq('project_id', projectId)
    .eq('parent_id', parentId)
  if (error) throw error
}

// Orders
export async function getOrders(parentId?: string) {
  let query = supabase
    .from('order_headers_view')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (parentId) {
    query = query.eq('parent_id', parentId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(*), projects(*), parents(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createOrder(
  projectId: string,
  parentId: string,
  items: Array<{ productId: string; productName: string; price: number; quantity: number }>,
  customerName: string,
  generatePaymentLink: boolean
) {
  // Crear order_header
  const { data: header, error: headerError } = await supabase
    .from('order_headers')
    .insert({
      project_id: projectId,
      parent_id: parentId,
      customer_name: customerName,
      payment_status: 'unpaid',
      delivery_status: 'pending',
    })
    .select()
    .single()

  if (headerError) throw headerError

  // Crear order_items para cada producto
  const itemsToInsert = items.map(item => ({
    order_header_id: header.id,
    product_id: item.productId,
    product_name: item.productName,
    price: item.price,
    quantity: item.quantity,
  }))

  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)
    .select()

  if (itemsError) throw itemsError

  return { header, items: itemsData }
}

export async function updateOrderStatus(
  id: string,
  paymentStatus?: PaymentStatus,
  deliveryStatus?: DeliveryStatus
) {
  const updateData: any = {}
  if (paymentStatus) updateData.payment_status = paymentStatus
  if (deliveryStatus) updateData.delivery_status = deliveryStatus

  const { data, error } = await supabase
    .from('order_headers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

export async function searchOrdersByCustomer(searchTerm: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, products(*), projects(*), parents(*)')
    .ilike('customer_name', `%${searchTerm}%`)
    .order('customer_name')
}

export async function getOrderStats() {
  const { data: headers, error: headersError } = await supabase
    .from('order_headers')
    .select('*, order_items(*)')

  if (headersError) throw headersError

  const totalOrders = headers.length
  const totalProducts = headers.reduce((sum, header) => {
    return sum + (header.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0)
  }, 0)
  const totalRevenue = headers.reduce((sum, header) => {
    return sum + (header.order_items?.reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0) || 0)
  }, 0)
  const pendingPayments = headers.filter(o => o.payment_status === 'unpaid').length
  const pendingDeliveries = headers.filter(o => o.delivery_status === 'pending').length

  return {
    totalOrders,
    totalProducts,
    totalRevenue,
    pendingPayments,
    pendingDeliveries
  }
}

export async function updateOrderPaymentStatus(orderId: string, status: 'paid' | 'unpaid') {
  const { error } = await supabase
    .from('order_headers')
    .update({ payment_status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw error
}

export async function updateOrderDeliveryStatus(orderId: string, status: 'delivered' | 'pending') {
  const { error } = await supabase
    .from('order_headers')
    .update({ delivery_status: status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw error
}
