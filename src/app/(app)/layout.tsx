'use client'

import { LaborsafeGProvider } from '@/context/LaborsafeGContext'
import { Toaster } from '@/components/ui/toaster'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LaborsafeGProvider>
      {children}
      <Toaster />
    </LaborsafeGProvider>
  )
}
