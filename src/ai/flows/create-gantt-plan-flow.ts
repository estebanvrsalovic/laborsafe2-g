import { callGemini } from '@/ai/genkit'

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
  const currentDate = new Date().toISOString().split('T')[0]

  const activitiesList = input
    .map((a, i) => `${i + 1}. ID: ${a.id}\n   Risk: ${a.risk}\n   Measure: ${a.measure}\n   Risk Level: ${a.riskLevel}`)
    .join('\n\n')

  const prompt = `You are an expert in occupational risk management and project planning.
Create a Gantt chart implementation plan for these control measures.

For each measure:
1. id: Return the original id
2. priority: Intolerable->Crítica, Importante/Alto->Alta, Moderado/Medio->Media, Tolerable/Bajo->Baja
3. responsible: Assign role (e.g., "Supervisor", "Comité Paritario", "Jefe de Área")
4. startDate & endDate: Format YYYY-MM-DD, today is ${currentDate}
5. status: All start as "Pendiente"

Activities:
${activitiesList}

Respond with JSON array:
[{"id":"...","priority":"Crítica|Alta|Media|Baja","responsible":"...","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","status":"Pendiente"}]`

  try {
    const response = await callGemini(prompt)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (error: any) {
    console.error('createGanttPlan error:', error.message)
    throw error
  }

  throw new Error('No se pudo generar el plan Gantt')
}
