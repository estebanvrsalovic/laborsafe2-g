'use server'

import { callGemini } from '@/ai/genkit'
import { z } from 'zod'

const ControlMeasureSchema = z.object({
  classification: z.enum(['Eliminación', 'Sustitución', 'Control de Ingeniería', 'Control Administrativo', 'EPP']),
  description: z.string(),
})

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

export type SuggestControlMeasuresOutput = z.infer<typeof ControlMeasureSchema>[]

export async function suggestControlMeasures(
  input: SuggestControlMeasuresInput,
  riskEvaluations?: {
    hygienic?: { riskLevel: string }
    psychosocial?: { riskLevel: string; dimension: string }
    musculoskeletal?: { riskLevel: string }
  }
): Promise<SuggestControlMeasuresOutput> {
  const enrichedInput = {
    ...input,
    hygienicRiskLevel: riskEvaluations?.hygienic?.riskLevel || 'No aplica',
    psychosocialRiskLevel: riskEvaluations?.psychosocial?.riskLevel || 'No aplica',
    psychosocialDimension: riskEvaluations?.psychosocial?.dimension || 'No aplica',
    musculoskeletalRiskLevel: riskEvaluations?.musculoskeletal?.riskLevel || 'No aplica',
  }

  const contextDetails = [
    enrichedInput.frequency && `Frecuencia: ${enrichedInput.frequency}`,
    enrichedInput.duration && `Duración: ${enrichedInput.duration}`,
    enrichedInput.tools && `Herramientas: ${enrichedInput.tools}`,
    enrichedInput.materials && `Materiales: ${enrichedInput.materials}`,
    enrichedInput.environmentalConditions && `Condiciones: ${enrichedInput.environmentalConditions}`,
    enrichedInput.requiredTraining && `Capacitación: ${enrichedInput.requiredTraining}`,
  ].filter(Boolean).join('\n')

  const prompt = `IMPORTANTE: Solo usa la información proporcionada. NO uses ejemplos de otros procesos.

**CONTEXTO DEL RIESGO:**
Proceso: ${enrichedInput.process}
Tarea: ${enrichedInput.task}
Peligro: ${enrichedInput.hazard}
Riesgo: ${enrichedInput.risk}

**DETALLES ESPECÍFICOS:**
${contextDetails}

**EVALUACIONES:**
- Seguridad: ${enrichedInput.riskLevel}
- Higiénico: ${enrichedInput.hygienicRiskLevel}
- Psicosocial: ${enrichedInput.psychosocialRiskLevel} - ${enrichedInput.psychosocialDimension}
- Musculoesquelético: ${enrichedInput.musculoskeletalRiskLevel}

Genera 3-4 medidas de control específicas. Prioriza jerarquía: Eliminación > Sustitución > Ingeniería > Administrativo > EPP.
Responde SOLO con JSON array:
[{"classification": "Eliminación|Sustitución|Control de Ingeniería|Control Administrativo|EPP", "description": "descripción específica"}]`

  try {
    const response = await callGemini(prompt)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const output = JSON.parse(jsonMatch[0])
      if (Array.isArray(output) && output.length > 0) return output
    }
  } catch (error: any) {
    console.error('suggestControlMeasures error:', error.message)
    throw error
  }

  throw new Error('No se pudieron generar medidas de control')
}
