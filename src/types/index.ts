export type UserRole = 'admin' | 'parent'

export type PaymentStatus = 'pending' | 'paid'
export type DeliveryStatus = 'pending' | 'delivered'

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Parent {
  id: string
  name: string
  email: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  project_id: string
  name: string
  price: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  products?: Product[]
  allowedParentIds?: string[]
}

export interface ProjectParent {
  id: string
  project_id: string
  parent_id: string
  created_at: string
}

export interface Order {
  id: string
  project_id: string
  parent_id: string
  product_id: string
  product_name: string
  price: number
  quantity: number
  customer_name: string
  payment_link: string | null
  payment_status: PaymentStatus
  delivery_status: DeliveryStatus
  created_at: string
  updated_at: string
}

export interface OrderWithProduct extends Order {
  product?: Product
  project?: Project
  parent?: Parent
}

export interface OrderFormData {
  projectId: string
  productId: string
  quantity: number
  customerName: string
  generatePaymentLink: boolean
}
