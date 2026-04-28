import { ParentLayout } from '@/components/parent-layout'

export default function ParentRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ParentLayout>{children}</ParentLayout>
}
