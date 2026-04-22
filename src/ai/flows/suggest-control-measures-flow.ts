import { callFunction } from '@/ai/client'

export type SuggestControlMeasuresInput = {
  process: string
  processDescription: string
  task: string
  hazard: string
  risk: string
  probability: string
  consequence: string
  riskLevel: string
  hygienicRiskLevel?: string
  psychosocialRiskLevel?: string
  psychosocialDimension?: string
  musculoskeletalRiskLevel?: string
  frequency?: string
  duration?: string
  tools?: string
  materials?: string
  environmentalConditions?: string
  requiredTraining?: string
}

export type SuggestControlMeasuresOutput = Array<{
  classification: 'Eliminación' | 'Sustitución' | 'Control de Ingeniería' | 'Control Administrativo' | 'EPP'
  description: string
}>

export async function suggestControlMeasures(
  input: SuggestControlMeasuresInput,
  riskEvaluations?: {
    hygienic?: { riskLevel: string }
    psychosocial?: { riskLevel: string; dimension: string }
    musculoskeletal?: { riskLevel: string }
  }
): Promise<SuggestControlMeasuresOutput> {
  const body = {
    ...input,
    hygienicRiskLevel: riskEvaluations?.hygienic?.riskLevel || 'No aplica',
    psychosocialRiskLevel: riskEvaluations?.psychosocial?.riskLevel || 'No aplica',
    psychosocialDimension: riskEvaluations?.psychosocial?.dimension || 'No aplica',
    musculoskeletalRiskLevel: riskEvaluations?.musculoskeletal?.riskLevel || 'No aplica',
  }
  return callFunction<SuggestControlMeasuresOutput>('suggestControlMeasures', body)
}
