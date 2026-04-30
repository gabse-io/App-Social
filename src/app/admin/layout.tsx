import { AdminLayout } from '@/components/admin-layout'

// Force dynamic rendering to avoid hydration mismatch with auth state
export const dynamic = 'force-dynamic'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
