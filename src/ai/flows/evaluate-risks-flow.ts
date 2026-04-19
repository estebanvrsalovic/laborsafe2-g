'use server'

import { callGemini } from '@/ai/genkit'
import { z } from 'zod'

const EvaluateRisksOutputSchema = z.object({
  security: z.object({
    probability: z.enum(['Baja', 'Media', 'Alta']),
    consequence: z.enum(['Leve', 'Grave', 'Muy Grave']),
  }),
  hygienic: z.object({ riskLevel: z.enum(['Bajo', 'Medio', 'Alto', 'No aplica']) }),
  psychosocial: z.object({
    riskLevel: z.enum(['Bajo', 'Medio', 'Alto', 'No aplica']),
    dimension: z.string(),
    justification: z.string(),
  }),
  musculoskeletal: z.object({ riskLevel: z.enum(['Bajo', 'Medio', 'Alto', 'No aplica']) }),
})

export type EvaluateRisksInput = {
  process: string
  taskName: string
  hazard: string
  riskEvent: string
  jobPositionsInvolved: string
  sexGenderIdentities: string
}

export type EvaluateRisksOutput = z.infer<typeof EvaluateRisksOutputSchema>

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
  const probability = hazardLower.includes('altura') || hazardLower.includes('eléctric') ? 'Media' : 'Baja'
  const consequence = hazardLower.includes('mort') || hazardLower.includes('grave') ? 'Grave' : 'Leve'

  return {
    security: { probability, consequence },
    hygienic: { riskLevel: 'No aplica' },
    psychosocial: { riskLevel: 'No aplica', dimension: 'No aplica', justification: 'No aplica' },
    musculoskeletal: { riskLevel: 'No aplica' },
  }
}
