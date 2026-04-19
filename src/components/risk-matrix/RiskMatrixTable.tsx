"use client"

import { useState } from "react"
import { useLaborsafe } from "@/hooks/useLaborsafe"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CONSEQUENCE_LEVELS, PROBABILITY_LEVELS, RISK_LEVELS_GENERIC } from "@/lib/constants"
import AISuggestions from "./AISuggestions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getPriorityBadge } from "@/lib/utils"
import type { ControlMeasure } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Wrench, UserCheck, Info, PlusSquare, Wand, Trash2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const classificationIcons: { [key: string]: React.ElementType } = {
  'Eliminación': Shield, 'Sustitución': Shield,
  'Control de Ingeniería': Wrench, 'Control Administrativo': UserCheck, 'EPP': UserCheck, 'default': Info,
}

export default function RiskMatrixTable() {
  const { riskAnalyses, updateRiskAnalysis, syncProcessesToMatrix, deleteRiskAnalysis, identifyRisksForRisk, loadingAI, addRiskAnalysisRow } = useLaborsafe()

  const getClassificationIcon = (classification: string) => {
    const Icon = classificationIcons[classification] || classificationIcons['default']
    return <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
  }

  const getRiskLevelStyle = (level: string) => {
    switch (level) {
      case 'Bajo': case 'Tolerable': return { backgroundColor: '#22c55e', color: '#ffffff' }
      case 'Medio': case 'Moderado': return { backgroundColor: '#eab308', color: '#000000' }
      case 'Alto': case 'Importante': case 'Intolerable': case 'Crítico': return { backgroundColor: '#ef4444', color: '#ffffff' }
      default: return {}
    }
  }

  const getMaxRiskLevel = (risk: any): string => {
    const levels = [risk.security.riskLevel, risk.hygienic.riskLevel, risk.psychosocial.riskLevel, risk.musculoskeletal.riskLevel]
    if (levels.some(l => ['Alto', 'Crítico', 'Intolerable', 'Importante'].includes(l))) return 'Alto'
    if (levels.some(l => ['Medio', 'Moderado'].includes(l))) return 'Medio'
    return 'Bajo'
  }

  if (riskAnalyses.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center py-16">
        <CardHeader>
          <CardTitle>Matriz de Riesgo Vacía</CardTitle>
          <CardDescription>Sincronice sus procesos para comenzar a construir la matriz.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={syncProcessesToMatrix}><LinkIcon className="mr-2 h-4 w-4" />Sincroniza los Procesos</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <TooltipProvider>
        <div className="relative w-full overflow-auto h-[75vh]">
          <table className="min-w-max text-sm w-full caption-bottom">
            <thead className="sticky top-0 z-40 bg-card [&_tr]:border-b">
              <tr className="bg-card border-b">
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px] sticky left-0 bg-card z-50">N°</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px] sticky left-[50px] bg-card z-50">Acciones</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] sticky left-[150px] bg-card z-50">Proceso</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-card">Puestos de trabajo</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-card">Tareas</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px] bg-card">Peligros/Factores de Riesgos</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px] bg-card">Riesgo</th>
                <th colSpan={4} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground border-l border-b bg-card">Evaluación de Riesgos de Seguridad</th>
                <th colSpan={1} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground border-l border-b bg-card">Riesgos Higiénicos</th>
                <th colSpan={2} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground border-l border-b bg-card">Riesgos Psicosociales</th>
                <th colSpan={1} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground border-l border-b bg-card">Músculo Esquelético</th>
                <th rowSpan={2} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[400px] bg-card">Medidas Preventivas</th>
              </tr>
              <tr className="bg-card border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] border-l bg-card">Probabilidad (P)</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-card">Consecuencia (S)</th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground min-w-[100px] bg-card">VEP</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] bg-card">Nivel de Riesgo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] border-l bg-card">Nivel de Riesgo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] border-l bg-card">Nivel de Riesgo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px] bg-card">Dimensión Psicosocial</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px] border-l bg-card">Nivel de Riesgo</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {riskAnalyses.map((risk, index) => (
                <tr key={risk.id} id={risk.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium sticky left-0 z-10 text-center" style={getRiskLevelStyle(getMaxRiskLevel(risk))}>
                    {index + 1}
                  </td>
                  <td className="p-4 align-middle sticky left-[50px] z-10" style={getRiskLevelStyle(getMaxRiskLevel(risk))}>
                    <div className="flex flex-col items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => addRiskAnalysisRow(risk.id)}><PlusSquare className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Añadir nueva fila con este contexto</p></TooltipContent>
                      </Tooltip>
                      {!risk.hazard && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => identifyRisksForRisk(risk.id)} disabled={loadingAI}>
                              <Wand className="h-4 w-4 text-accent" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Deducir Tareas y Riesgos con IA</p></TooltipContent>
                        </Tooltip>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará permanentemente esta fila de la matriz de riesgo.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRiskAnalysis(risk.id)} className="bg-destructive hover:bg-destructive/90">Eliminar Fila</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium sticky left-[150px] z-10" style={getRiskLevelStyle(getMaxRiskLevel(risk))}>
                    <div className="h-full min-h-20 flex items-center">{risk.process}</div>
                  </td>
                  <td className="p-4 align-middle"><div className="h-full min-h-20 flex items-center">{risk.jobPositionsInvolved}</div></td>
                  <td className="p-4 align-middle"><div className="h-full min-h-20 flex items-center">{risk.taskName}</div></td>
                  <td className="p-4 align-middle">
                    <Textarea value={risk.hazard} onChange={e => updateRiskAnalysis({ id: risk.id, hazard: e.target.value })} className="h-20" placeholder="Identificar peligro..." />
                  </td>
                  <td className="p-4 align-middle">
                    <Textarea value={risk.risk} onChange={e => updateRiskAnalysis({ id: risk.id, risk: e.target.value })} className="h-20" placeholder="Describir riesgo..." />
                  </td>

                  {/* Seguridad */}
                  <td className="p-4 align-middle border-l">
                    <Select value={risk.security.probability} onValueChange={value => updateRiskAnalysis({ id: risk.id, security: { ...risk.security, probability: value } })}>
                      <SelectTrigger><SelectValue placeholder="Evaluar" /></SelectTrigger>
                      <SelectContent>
                        {PROBABILITY_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            <Tooltip><TooltipTrigger asChild><div>{level.label}</div></TooltipTrigger><TooltipContent side="right" className="max-w-xs"><p>{level.description}</p></TooltipContent></Tooltip>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 align-middle">
                    <Select value={risk.security.consequence} onValueChange={value => updateRiskAnalysis({ id: risk.id, security: { ...risk.security, consequence: value } })}>
                      <SelectTrigger><SelectValue placeholder="Evaluar" /></SelectTrigger>
                      <SelectContent>
                        {CONSEQUENCE_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            <Tooltip><TooltipTrigger asChild><div>{level.label}</div></TooltipTrigger><TooltipContent side="right" className="max-w-xs"><p>{level.description}</p></TooltipContent></Tooltip>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 align-middle text-center">
                    {risk.security.vep && <Badge variant="outline" className="text-lg bg-white/50 border-gray-400">{risk.security.vep}</Badge>}
                  </td>
                  <td className="p-4 align-middle">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge role="button" variant={getPriorityBadge(risk.security.riskLevel || 'default')} className="text-base cursor-pointer hover:opacity-80">
                          {risk.security.riskLevel || "Evaluar"}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="p-2 text-sm text-muted-foreground">El nivel se calcula automáticamente.</div>
                      </PopoverContent>
                    </Popover>
                  </td>

                  {/* Higiénico */}
                  <td className="p-4 align-middle border-l">
                    <Select value={risk.hygienic.riskLevel} onValueChange={value => updateRiskAnalysis({ id: risk.id, hygienic: { ...risk.hygienic, riskLevel: value } })}>
                      <SelectTrigger><Badge variant={getPriorityBadge(risk.hygienic.riskLevel)} className="text-base">{risk.hygienic.riskLevel}</Badge></SelectTrigger>
                      <SelectContent>{RISK_LEVELS_GENERIC.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>

                  {/* Psicosocial */}
                  <td className="p-4 align-middle border-l">
                    <Select value={risk.psychosocial.riskLevel} onValueChange={value => updateRiskAnalysis({ id: risk.id, psychosocial: { ...risk.psychosocial, riskLevel: value } })}>
                      <SelectTrigger><Badge variant={getPriorityBadge(risk.psychosocial.riskLevel)} className="text-base">{risk.psychosocial.riskLevel}</Badge></SelectTrigger>
                      <SelectContent>{RISK_LEVELS_GENERIC.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-center align-middle">
                    {risk.psychosocial.dimension && risk.psychosocial.dimension !== 'No aplica' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="cursor-help whitespace-nowrap">{risk.psychosocial.dimension}</Badge>
                        </TooltipTrigger>
                        <TooltipContent><p>{risk.psychosocial.justification}</p></TooltipContent>
                      </Tooltip>
                    ) : null}
                  </td>

                  {/* Musculoesquelético */}
                  <td className="p-4 align-middle border-l">
                    <Select value={risk.musculoskeletal.riskLevel} onValueChange={value => updateRiskAnalysis({ id: risk.id, musculoskeletal: { ...risk.musculoskeletal, riskLevel: value } })}>
                      <SelectTrigger><Badge variant={getPriorityBadge(risk.musculoskeletal.riskLevel)} className="text-base">{risk.musculoskeletal.riskLevel}</Badge></SelectTrigger>
                      <SelectContent>{RISK_LEVELS_GENERIC.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>

                  {/* Medidas */}
                  <td className="p-4 align-middle">
                    <div className="flex flex-col items-start justify-between h-full min-h-[100px] gap-2">
                      {risk.preventiveMeasures.length > 0 ? (
                        <>
                          <ScrollArea className="h-24 w-full">
                            <div className="space-y-2">
                              {risk.preventiveMeasures.map(measure => (
                                <div key={measure.id} className="flex items-start text-xs group">
                                  {getClassificationIcon(measure.classification)}
                                  <div className="flex-grow">
                                    <Badge variant="secondary" className="mb-1">{measure.classification}</Badge>
                                    <p>{measure.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <AISuggestions risk={risk} />
                        </>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground text-xs w-full">
                          <p>Sin medidas aún.</p>
                          <AISuggestions risk={risk} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
    </div>
  )
}
