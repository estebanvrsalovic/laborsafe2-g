import { callGemini } from '@/ai/genkit'

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
  const prompt = `Eres un experto en prevención de riesgos laborales en Chile (Ley 16.744, DS 40, DS 594).

PROCESO: ${input.process}
DESCRIPCIÓN: ${input.processDescription}
TAREA: ${input.taskDescription}
PUESTOS: ${input.jobPositionsInvolved}
${input.specificLocation ? `UBICACIÓN: ${input.specificLocation}` : ''}
${input.numberOfWorkers ? `TRABAJADORES: ${input.numberOfWorkers}` : ''}
${input.observations ? `OBSERVACIONES: ${input.observations}` : ''}

Identifica 5-8 peligros y riesgos específicos para esta tarea. Responde SOLO con JSON array:
[{
  "riskType": "fisico|quimico|biologico|ergonomico|psicosocial|mecanico",
  "category": "Gente|Equipos|Materiales|Ambiente|Procesos",
  "hazard": "peligro específico",
  "riskFactor": "factor de riesgo detallado",
  "riskEvent": "evento no deseado",
  "consequences": "consecuencias específicas",
  "frequency": "muy_alta|alta|media|baja",
  "severity": "critico|alto|medio|bajo"
}]`

  try {
    const response = await callGemini(prompt)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const risks = JSON.parse(jsonMatch[0])
      if (Array.isArray(risks) && risks.length > 0) return risks.slice(0, 10)
    }
  } catch (error: any) {
    console.warn('AI risk identification failed:', error.message)
  }

  return [{
    riskType: 'mecanico',
    category: 'Equipos',
    hazard: `Riesgos mecánicos en ${input.process}`,
    riskFactor: `Exposición a peligros durante ${input.taskDescription}`,
    riskEvent: 'Lesiones por contacto con elementos peligrosos',
    consequences: 'Lesiones leves a graves',
    frequency: 'media',
    severity: 'medio',
  }]
}
