"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Upload, X, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ActionPlanItem } from "@/lib/types";

interface PlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: ActionPlanItem;
  onSave: (plan: ActionPlanItem) => void;
  measureDescription: string;
}

export default function PlanDialog({ isOpen, onClose, plan, onSave, measureDescription }: PlanDialogProps) {
  const [formData, setFormData] = useState<Partial<ActionPlanItem>>(plan || {
    responsible: '',
    responsibleRole: '',
    startDate: '',
    endDate: '',
    budget: 0,
    status: 'No iniciado',
    progress: 0,
    verificationMethod: '',
    verificationDate: '',
    verificationResponsible: '',
    verificationResult: '',
    observations: '',
    difficulties: '',
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (plan) setFormData(plan);
  }, [plan]);

  const handleSave = () => {
    const newPlan: ActionPlanItem = {
      measureId: plan?.measureId || '',
      responsible: formData.responsible || '',
      responsibleRole: formData.responsibleRole || '',
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      budget: formData.budget,
      status: formData.status || 'No iniciado',
      progress: formData.progress || 0,
      verificationMethod: formData.verificationMethod || '',
      verificationDate: formData.verificationDate || '',
      verificationResponsible: formData.verificationResponsible || '',
      verificationResult: formData.verificationResult,
      observations: formData.observations,
      difficulties: formData.difficulties,
    };
    onSave(newPlan);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Planificar Implementación</DialogTitle>
          <p className="text-sm text-muted-foreground">{measureDescription}</p>
        </DialogHeader>

        <Tabs defaultValue="planning" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="planning">Planificación</TabsTrigger>
            <TabsTrigger value="verification">Verificación</TabsTrigger>
            <TabsTrigger value="tracking">Seguimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="planning" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsable</Label>
                <Input value={formData.responsible} onChange={e => setFormData({ ...formData, responsible: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={formData.responsibleRole} onChange={e => setFormData({ ...formData, responsibleRole: e.target.value })} placeholder="Ej: Supervisor de Seguridad" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !formData.startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(new Date(formData.startDate), "d MMM y", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? new Date(formData.startDate) : undefined}
                      onSelect={date => setFormData({ ...formData, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Fecha Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !formData.endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(new Date(formData.endDate), "d MMM y", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate ? new Date(formData.endDate) : undefined}
                      onSelect={date => setFormData({ ...formData, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Presupuesto ($)</Label>
                <Input type="number" value={formData.budget || ''} onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={value => setFormData({ ...formData, status: value as ActionPlanItem['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No iniciado">No iniciado</SelectItem>
                    <SelectItem value="En planificación">En planificación</SelectItem>
                    <SelectItem value="En ejecución">En ejecución</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Avance (%)</Label>
              <Input type="number" min="0" max="100" value={formData.progress || 0} onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })} />
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <div>
              <Label>Método de Verificación</Label>
              <Textarea value={formData.verificationMethod} onChange={e => setFormData({ ...formData, verificationMethod: e.target.value })} placeholder="Ej: Inspección visual, medición de ruido, revisión de registros" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Verificación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !formData.verificationDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.verificationDate ? format(new Date(formData.verificationDate), "d MMM y", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.verificationDate ? new Date(formData.verificationDate) : undefined}
                      onSelect={date => setFormData({ ...formData, verificationDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Responsable de Verificar</Label>
                <Input value={formData.verificationResponsible} onChange={e => setFormData({ ...formData, verificationResponsible: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Resultado de Verificación</Label>
              <Textarea value={formData.verificationResult} onChange={e => setFormData({ ...formData, verificationResult: e.target.value })} placeholder="Resultado de la verificación (completar después de verificar)" />
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <div>
              <Label>Observaciones</Label>
              <Textarea value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })} placeholder="Observaciones generales" />
            </div>
            <div>
              <Label>Dificultades Encontradas</Label>
              <Textarea value={formData.difficulties} onChange={e => setFormData({ ...formData, difficulties: e.target.value })} placeholder="Problemas o dificultades durante la implementación" />
            </div>
            <div>
              <Label>Documentos de Evidencia</Label>
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 mt-2">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">Subir evidencias</span>
                  <span className="text-xs text-muted-foreground">Facturas, fotos, certificados</span>
                </div>
                <input type="file" className="hidden" multiple onChange={e => e.target.files && setFiles(Array.from(e.target.files))} />
              </label>
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
