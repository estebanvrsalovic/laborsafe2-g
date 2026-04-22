import { callFunction } from '@/ai/client'

export type EvaluateRisksInput = {
  process: string
  taskName: string
  hazard: string
  riskEvent: string
  jobPositionsInvolved: string
  sexGenderIdentities: string
}

export type EvaluateRisksOutput = {
  security: { probability: 'Baja' | 'Media' | 'Alta'; consequence: 'Leve' | 'Grave' | 'Muy Grave' }
  hygienic: { riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'No aplica' }
  psychosocial: { riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'No aplica'; dimension: string; justification: string }
  musculoskeletal: { riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'No aplica' }
}

export async function evaluateRisks(input: EvaluateRisksInput): Promise<EvaluateRisksOutput> {
  return callFunction<EvaluateRisksOutput>('evaluateRisks', input)
}
