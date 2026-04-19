"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Lightbulb, Trash2, PlusCircle, Pencil } from "lucide-react"
import { useLaborsafe } from "@/hooks/useLaborsafe"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ControlMeasure, RiskAnalysis } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CONTROL_CLASSIFICATIONS } from "@/lib/types"
import { Label } from "@/components/ui/label"

interface AISuggestionsProps { risk: RiskAnalysis }
type EditableMeasure = Omit<ControlMeasure, 'responsible' | 'startDate' | 'endDate' | 'status'>
type Suggestion = { id: string; description: string; classification: string }

function AISuggestionsDialogContent({ risk, setDialogOpen }: { risk: RiskAnalysis; setDialogOpen: (open: boolean) => void }) {
  const { suggestControlsWithAI, loadingAI: globalLoadingAI, updateRiskAnalysis } = useLaborsafe()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editableMeasures, setEditableMeasures] = useState<EditableMeasure[]>([])

  useEffect(() => {
    setEditableMeasures(risk.preventiveMeasures.map(m => ({ id: m.id, description: m.description, classification: m.classification })))
  }, [risk.preventiveMeasures])

  const handleSuggest = async () => {
    setIsLoading(true)
    setSuggestions([])
    const result = await suggestControlsWithAI(risk.id)
    if (result) {
      setSuggestions(result.map((s, i) => ({ id: `suggestion-${Date.now()}-${i}`, description: s.description, classification: s.classification })))
    }
    setIsLoading(false)
  }

  const handleAddSuggestion = (suggestion: Suggestion) => {
    setEditableMeasures(prev => [...prev, { id: `measure-${risk.id}-${Date.now()}-${prev.length}`, description: suggestion.description, classification: suggestion.classification }])
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  const handleAddNewMeasure = () => {
    setEditableMeasures(prev => [...prev, { id: `measure-${risk.id}-${Date.now()}-${prev.length}`, description: "", classification: "Control Administrativo" }])
  }

  const handleRemoveMeasure = (id: string) => setEditableMeasures(prev => prev.filter(m => m.id !== id))
  const handleMeasureChange = (id: string, field: 'description' | 'classification', value: string) =>
    setEditableMeasures(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

  const handleSaveChanges = () => {
    const validMeasures = editableMeasures.filter(m => m.description.trim() !== "")
    const finalMeasures: ControlMeasure[] = validMeasures.map(em => {
      const existing = risk.preventiveMeasures.find(pm => pm.id === em.id)
      return {
        ...(existing || {}), id: em.id, description: em.description,
        classification: em.classification || 'Control Administrativo',
        responsible: existing?.responsible || '', startDate: existing?.startDate || '',
        endDate: existing?.endDate || '', status: existing?.status || 'Pendiente',
      }
    })
    updateRiskAnalysis({ id: risk.id, preventiveMeasures: finalMeasures })
    setDialogOpen(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar Medidas Preventivas</DialogTitle>
        <DialogDescription>Añada, edite o elimine las medidas de control. Use el botón de IA para obtener sugerencias.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-grow min-h-0">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center pr-4">
            <h4 className="font-medium text-lg">Medidas Actuales</h4>
            <Button onClick={handleAddNewMeasure} size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Añadir Medida</Button>
          </div>
          <ScrollArea className="h-[50vh] border rounded-md p-1 bg-muted/20">
            <div className="space-y-3 p-3">
              {editableMeasures.length === 0 && <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground p-8"><p>No hay medidas definidas.</p></div>}
              {editableMeasures.map(measure => (
                <div key={measure.id} className="p-3 border rounded-lg space-y-2 bg-background relative group shadow-sm">
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveMeasure(measure.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div>
                    <Label className="text-xs font-semibold">Descripción</Label>
                    <Textarea value={measure.description} onChange={e => handleMeasureChange(measure.id, 'description', e.target.value)} placeholder="Describir medida..." className="h-24 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Clasificación</Label>
                    <Select value={measure.classification} onValueChange={value => handleMeasureChange(measure.id, 'classification', value)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTROL_CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-lg">Sugerencias de la IA</h4>
            <Button onClick={handleSuggest} disabled={isLoading || globalLoadingAI} size="sm">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generar Sugerencias
            </Button>
          </div>
          <ScrollArea className="h-[50vh] border rounded-md p-1 bg-muted/20">
            {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
            {!isLoading && suggestions.length > 0 && (
              <div className="space-y-2 p-2">
                {suggestions.map(s => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-md border bg-background">
                    <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-sm font-semibold">{s.classification}</p>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddSuggestion(s)}><PlusCircle className="h-4 w-4 mr-2" />Añadir</Button>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && suggestions.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground p-8"><p>Haga clic en "Generar" para obtener sugerencias de la IA.</p></div>
            )}
          </ScrollArea>
        </div>
      </div>
      <DialogFooter className="pt-4 border-t mt-auto">
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
        <Button type="button" onClick={handleSaveChanges}>Guardar Cambios</Button>
      </DialogFooter>
    </>
  )
}

export default function AISuggestions({ risk }: AISuggestionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {risk.preventiveMeasures.length > 0 ? (
          <Button variant="ghost" size="sm"><Pencil className="mr-2 h-4 w-4" />Editar Medidas</Button>
        ) : (
          <Button variant="outline" size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4" />Añadir Medida</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="w-12 h-12 animate-spin" /></div>}>
          {dialogOpen && <AISuggestionsDialogContent risk={risk} setDialogOpen={setDialogOpen} />}
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}
