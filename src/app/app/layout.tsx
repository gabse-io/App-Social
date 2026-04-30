import { ParentLayout } from '@/components/parent-layout'

// Force dynamic rendering to avoid hydration mismatch with auth state
export const dynamic = 'force-dynamic'

export default function ParentRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ParentLayout>{children}</ParentLayout>
}
