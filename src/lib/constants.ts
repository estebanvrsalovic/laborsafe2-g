export const PROBABILITY_LEVELS: { value: string; label: string; description: string; numeric: number }[] = [
  { value: "Baja", label: "Baja (1)", description: "El daño ocurrirá raras veces.", numeric: 1 },
  { value: "Media", label: "Media (2)", description: "El daño ocurrirá en algunas ocasiones.", numeric: 2 },
  { value: "Alta", label: "Alta (3)", description: "El daño ocurrirá siempre o casi siempre.", numeric: 3 },
]

export const CONSEQUENCE_LEVELS: { value: string; label: string; description: string; numeric: number }[] = [
  { value: "Leve", label: "Leve (1)", description: "Daños superficiales: pequeños cortes, magulladuras, molestias.", numeric: 1 },
  { value: "Grave", label: "Grave (2)", description: "Lesiones con incapacidad laboral temporal: fracturas, quemaduras, conmociones.", numeric: 2 },
  { value: "Muy Grave", label: "Muy Grave (3)", description: "Lesiones con incapacidad laboral permanente: amputaciones, fracturas mayores, lesiones fatales.", numeric: 3 },
]

export const RISK_LEVELS_GENERIC = [
  { value: "No aplica", label: "No aplica" },
  { value: "Bajo", label: "Bajo" },
  { value: "Medio", label: "Medio" },
  { value: "Alto", label: "Alto" },
]

export const getVep = (probability: string, consequence: string): number | null => {
  const probLevel = PROBABILITY_LEVELS.find(p => p.value === probability)
  const consLevel = CONSEQUENCE_LEVELS.find(c => c.value === consequence)
  if (probLevel && consLevel) return probLevel.numeric * consLevel.numeric
  return null
}

export const calculateRiskLevel = (vep: number | null): string => {
  if (vep === null || vep < 1) return ""
  if (vep <= 2) return "Bajo"
  if (vep <= 4) return "Medio"
  return "Alto"
}

export const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'Bajo': case 'Tolerable': return 'bg-green-500 text-white'
    case 'Medio': case 'Moderado': return 'bg-yellow-400 text-black'
    case 'Alto': case 'Importante': case 'Intolerable': case 'Crítico': return 'bg-red-600 text-white'
    default: return 'bg-gray-200 text-gray-800'
  }
}
