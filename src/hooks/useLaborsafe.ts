'use client'

import { useContext } from 'react'
import { LaborsafeGContext } from '@/context/LaborsafeGContext'

export function useLaborsafe() {
  const ctx = useContext(LaborsafeGContext)
  if (!ctx) throw new Error('useLaborsafe must be used inside LaborsafeGProvider')
  return ctx
}
