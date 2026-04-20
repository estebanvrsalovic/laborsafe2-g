import { callGemini } from '@/ai/genkit'

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
  const prompt = `Eres experto en evaluación de riesgos laborales en Chile (ISP, Res. Ex. E668/25).

PROCESO: ${input.process}
TAREA: ${input.taskName}
PELIGRO: ${input.hazard}
RIESGO: ${input.riskEvent}
PUESTOS: ${input.jobPositionsInvolved}

Evalúa los riesgos. Responde SOLO con JSON:
{
  "security": {"probability": "Baja|Media|Alta", "consequence": "Leve|Grave|Muy Grave"},
  "hygienic": {"riskLevel": "Bajo|Medio|Alto|No aplica"},
  "psychosocial": {"riskLevel": "Bajo|Medio|Alto|No aplica", "dimension": "nombre dimensión o No aplica", "justification": "justificación breve"},
  "musculoskeletal": {"riskLevel": "Bajo|Medio|Alto|No aplica"}
}`

  try {
    const response = await callGemini(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      if (result.security && result.hygienic && result.psychosocial && result.musculoskeletal) return result
    }
  } catch (error: any) {
    console.warn('AI risk evaluation failed:', error.message)
  }

  const hazardLower = input.hazard.toLowerCase()
  return {
    security: {
      probability: hazardLower.includes('altura') || hazardLower.includes('eléctric') ? 'Media' : 'Baja',
      consequence: hazardLower.includes('mort') || hazardLower.includes('grave') ? 'Grave' : 'Leve',
    },
    hygienic: { riskLevel: 'No aplica' },
    psychosocial: { riskLevel: 'No aplica', dimension: 'No aplica', justification: 'No aplica' },
    musculoskeletal: { riskLevel: 'No aplica' },
  }
}
