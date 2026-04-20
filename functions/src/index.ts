import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const geminiApiKey = defineSecret('GEMINI_API_KEY')

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  const data = await response.json() as any
  if (!response.ok || !data.candidates) throw new Error(`Gemini API Error: ${JSON.stringify(data)}`)
  return data.candidates[0].content.parts[0].text as string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const evaluateRisks = onRequest({ secrets: [geminiApiKey], region: 'us-central1' }, async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }

  const { process, taskName, hazard, riskEvent, jobPositionsInvolved } = req.body

  const prompt = `Eres experto en evaluación de riesgos laborales en Chile (ISP, Res. Ex. E668/25).

PROCESO: ${process}
TAREA: ${taskName}
PELIGRO: ${hazard}
RIESGO: ${riskEvent}
PUESTOS: ${jobPositionsInvolved}

Evalúa los riesgos. Responde SOLO con JSON:
{
  "security": {"probability": "Baja|Media|Alta", "consequence": "Leve|Grave|Muy Grave"},
  "hygienic": {"riskLevel": "Bajo|Medio|Alto|No aplica"},
  "psychosocial": {"riskLevel": "Bajo|Medio|Alto|No aplica", "dimension": "nombre dimensión o No aplica", "justification": "justificación breve"},
  "musculoskeletal": {"riskLevel": "Bajo|Medio|Alto|No aplica"}
}`

  try {
    const text = await callGemini(prompt, geminiApiKey.value())
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      res.json(result)
      return
    }
  } catch (error: any) {
    console.warn('evaluateRisks AI failed:', error.message)
  }

  const hazardLower = (hazard as string).toLowerCase()
  res.json({
    security: {
      probability: hazardLower.includes('altura') || hazardLower.includes('eléctric') ? 'Media' : 'Baja',
      consequence: hazardLower.includes('mort') || hazardLower.includes('grave') ? 'Grave' : 'Leve',
    },
    hygienic: { riskLevel: 'No aplica' },
    psychosocial: { riskLevel: 'No aplica', dimension: 'No aplica', justification: 'No aplica' },
    musculoskeletal: { riskLevel: 'No aplica' },
  })
})

export const suggestControlMeasures = onRequest({ secrets: [geminiApiKey], region: 'us-central1' }, async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }

  const input = req.body
  const contextDetails = [
    input.frequency && `Frecuencia: ${input.frequency}`,
    input.duration && `Duración: ${input.duration}`,
    input.tools && `Herramientas: ${input.tools}`,
    input.materials && `Materiales: ${input.materials}`,
    input.environmentalConditions && `Condiciones: ${input.environmentalConditions}`,
    input.requiredTraining && `Capacitación: ${input.requiredTraining}`,
  ].filter(Boolean).join('\n')

  const prompt = `IMPORTANTE: Solo usa la información proporcionada. NO uses ejemplos de otros procesos.

**CONTEXTO DEL RIESGO:**
Proceso: ${input.process}
Tarea: ${input.task}
Peligro: ${input.hazard}
Riesgo: ${input.risk}

**DETALLES ESPECÍFICOS:**
${contextDetails}

**EVALUACIONES:**
- Seguridad: ${input.riskLevel}
- Higiénico: ${input.hygienicRiskLevel || 'No aplica'}
- Psicosocial: ${input.psychosocialRiskLevel || 'No aplica'} - ${input.psychosocialDimension || 'No aplica'}
- Musculoesquelético: ${input.musculoskeletalRiskLevel || 'No aplica'}

Genera 3-4 medidas de control específicas. Prioriza jerarquía: Eliminación > Sustitución > Ingeniería > Administrativo > EPP.
Responde SOLO con JSON array:
[{"classification": "Eliminación|Sustitución|Control de Ingeniería|Control Administrativo|EPP", "description": "descripción específica"}]`

  try {
    const text = await callGemini(prompt, geminiApiKey.value())
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const output = JSON.parse(jsonMatch[0])
      if (Array.isArray(output) && output.length > 0) { res.json(output); return }
    }
  } catch (error: any) {
    console.error('suggestControlMeasures error:', error.message)
    res.status(500).json({ error: 'No se pudieron generar medidas de control' })
    return
  }

  res.status(500).json({ error: 'No se pudieron generar medidas de control' })
})

export const createTasksAndRisks = onRequest({ secrets: [geminiApiKey], region: 'us-central1' }, async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }

  const input = req.body

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
    const text = await callGemini(prompt, geminiApiKey.value())
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const risks = JSON.parse(jsonMatch[0])
      if (Array.isArray(risks) && risks.length > 0) { res.json(risks.slice(0, 10)); return }
    }
  } catch (error: any) {
    console.warn('createTasksAndRisks AI failed:', error.message)
  }

  res.json([{
    riskType: 'mecanico',
    category: 'Equipos',
    hazard: `Riesgos mecánicos en ${input.process}`,
    riskFactor: `Exposición a peligros durante ${input.taskDescription}`,
    riskEvent: 'Lesiones por contacto con elementos peligrosos',
    consequences: 'Lesiones leves a graves',
    frequency: 'media',
    severity: 'medio',
  }])
})

export const createGanttPlan = onRequest({ secrets: [geminiApiKey], region: 'us-central1' }, async (req, res) => {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }

  const input = req.body as Array<{ id: string; risk: string; measure: string; riskLevel: string }>
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
    const text = await callGemini(prompt, geminiApiKey.value())
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) { res.json(JSON.parse(jsonMatch[0])); return }
  } catch (error: any) {
    console.error('createGanttPlan error:', error.message)
    res.status(500).json({ error: 'No se pudo generar el plan Gantt' })
    return
  }

  res.status(500).json({ error: 'No se pudo generar el plan Gantt' })
})
