import { callFunction } from '@/ai/client'

export type CreateTasksAndRisksInput = {
  process: string
  processDescription: string
  jobPositionsInvolved: string
  taskDescription: string
  isRoutine?: boolean
  specificLocation?: string
  numberOfWorkers?: number
  sexGenderIdentities?: string
  observations?: string
}

export type CreateTasksAndRisksOutput = Array<{
  riskType: 'fisico' | 'quimico' | 'biologico' | 'ergonomico' | 'psicosocial' | 'mecanico'
  category: 'Gente' | 'Equipos' | 'Materiales' | 'Ambiente' | 'Procesos'
  hazard: string
  riskFactor: string
  riskEvent: string
  consequences: string
  frequency: 'muy_alta' | 'alta' | 'media' | 'baja'
  severity: 'critico' | 'alto' | 'medio' | 'bajo'
}>

export async function createTasksAndRisks(input: CreateTasksAndRisksInput): Promise<CreateTasksAndRisksOutput> {
  return callFunction<CreateTasksAndRisksOutput>('createTasksAndRisks', input)
}
