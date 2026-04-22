import { callFunction } from '@/ai/client'

export type CreateGanttPlanOutput = Array<{
  id: string
  priority: 'Crítica' | 'Alta' | 'Media' | 'Baja'
  responsible: string
  startDate: string
  endDate: string
  status: 'Pendiente' | 'En progreso' | 'Completado'
}>

export async function createGanttPlan(
  input: Array<{ id: string; risk: string; measure: string; riskLevel: string }>
): Promise<CreateGanttPlanOutput> {
  return callFunction<CreateGanttPlanOutput>('createGanttPlan', input)
}
