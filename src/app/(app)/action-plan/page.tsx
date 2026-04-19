"use client";

import { useLaborsafe } from "@/hooks/useLaborsafe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Edit, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMemo, useState } from "react";
import PlanDialog from "@/components/action-plan/PlanDialog";

export default function ActionPlanPage() {
  const { activeCompany, riskAnalyses, setRiskAnalyses } = useLaborsafe();
  const [editingMeasure, setEditingMeasure] = useState<{ riskId: string; measureId: string; description: string } | null>(null);

  const measures = useMemo(() => {
    const allMeasures = riskAnalyses
      .filter(risk => risk.security.riskLevel && risk.security.riskLevel !== 'Tolerable')
      .flatMap(risk =>
        risk.preventiveMeasures
          .filter(measure => !/procedimiento|protocolo|instructivo|capacitación|entrenamiento|inspección|revisión|mantenimiento|supervisión|control/i.test(measure.description))
          .map(measure => ({
            riskId: risk.id,
            risk: risk.risk,
            riskLevel: risk.security.riskLevel,
            vep: parseInt(risk.security.vep) || 0,
            process: risk.process,
            workersAffected: risk.numberOfWorkers || 0,
            sexGenderIdentities: risk.sexGenderIdentities || '',
            specificLocation: risk.specificLocation || '',
            measure,
            actionPlan: measure.actionPlan,
          }))
      );

    const completed = allMeasures.filter(m => m.actionPlan?.status === 'Completado');
    const pending = allMeasures.filter(m => m.actionPlan?.status !== 'Completado');
    pending.sort((a, b) => b.vep - a.vep);
    return [...pending, ...completed];
  }, [riskAnalyses]);

  const stats = useMemo(() => ({
    total: measures.length,
    planned: measures.filter(m => m.actionPlan).length,
    completed: measures.filter(m => m.actionPlan?.status === 'Completado').length,
    inExecution: measures.filter(m => m.actionPlan?.status === 'En ejecución').length,
    critical: measures.filter(m => m.riskLevel === 'Intolerable').length,
  }), [measures]);

  if (!activeCompany || riskAnalyses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Asignación de Medidas</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-muted-foreground" />
              Sin Datos
            </CardTitle>
            <CardDescription>
              Necesita una empresa activa y una matriz de riesgo con medidas de control.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const getBgColor = (riskLevel: string) => {
    if (riskLevel === 'Alto') return 'bg-red-100 dark:bg-red-950/30';
    if (riskLevel === 'Medio') return 'bg-yellow-100 dark:bg-yellow-950/30';
    if (riskLevel === 'Bajo') return 'bg-green-100 dark:bg-green-950/30';
    return '';
  };

  const getVepBadgeColor = (riskLevel: string) => {
    if (riskLevel === 'Alto') return 'bg-red-600 text-white hover:bg-red-700';
    if (riskLevel === 'Medio') return 'bg-yellow-500 text-white hover:bg-yellow-600';
    if (riskLevel === 'Bajo') return 'bg-green-600 text-white hover:bg-green-700';
    return 'bg-gray-500 text-white';
  };

  const MeasureCard = ({ item }: { item: typeof measures[0] }) => {
    const hasPlan = !!item.actionPlan;
    const isCritical = item.riskLevel === 'Intolerable';

    return (
      <Card className={`${getBgColor(item.riskLevel)} ${isCritical ? 'border-red-300' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {item.vep > 0 && <Badge className={getVepBadgeColor(item.riskLevel)}>VEP: {item.vep}</Badge>}
                <CardTitle className="text-lg">{item.measure.description}</CardTitle>
                {isCritical && <Badge variant="destructive">CRÍTICO</Badge>}
                {!hasPlan && <Badge variant="outline">Sin planificar</Badge>}
              </div>
              <CardDescription><span className="font-medium">Riesgo:</span> {item.risk}</CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span><span className="font-medium">Proceso:</span> {item.process}</span>
                <span><span className="font-medium">Lugar:</span> {item.specificLocation || 'No especificado'}</span>
                <span><span className="font-medium">Control:</span> {item.measure.classification}</span>
                <span><span className="font-medium">Trabajadores:</span> {item.sexGenderIdentities || 'No especificado'}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingMeasure({ riskId: item.riskId, measureId: item.measure.id, description: item.measure.description })}>
              <Edit className="w-4 h-4 mr-2" />
              {hasPlan ? 'Editar' : 'Planificar'}
            </Button>
          </div>
        </CardHeader>

        {hasPlan && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="font-medium">Responsable:</span><p className="text-muted-foreground">{item.actionPlan?.responsible} ({item.actionPlan?.responsibleRole})</p></div>
              <div><span className="font-medium">Inicio:</span><p className="text-muted-foreground">{item.actionPlan?.startDate || 'No definida'}</p></div>
              <div><span className="font-medium">Término:</span><p className="text-muted-foreground">{item.actionPlan?.endDate || 'No definida'}</p></div>
              <div><span className="font-medium">Estado:</span><Badge variant={item.actionPlan?.status === 'Completado' ? 'default' : 'outline'}>{item.actionPlan?.status}</Badge></div>
              <div><span className="font-medium">Avance:</span><p className="text-muted-foreground">{item.actionPlan?.progress}%</p></div>
              {item.actionPlan?.budget && <div><span className="font-medium">Presupuesto:</span><p className="text-muted-foreground">${item.actionPlan.budget.toLocaleString()}</p></div>}
            </div>

            {item.actionPlan?.verificationMethod && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Verificación de Eficacia</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="font-medium">Método:</span><p className="text-muted-foreground">{item.actionPlan.verificationMethod}</p></div>
                  <div><span className="font-medium">Fecha verificación:</span><p className="text-muted-foreground">{item.actionPlan.verificationDate || 'No definida'}</p></div>
                  <div><span className="font-medium">Responsable:</span><p className="text-muted-foreground">{item.actionPlan.verificationResponsible || 'No asignado'}</p></div>
                </div>
                {item.actionPlan.verificationResult && <div className="mt-2"><span className="font-medium">Resultado:</span><p className="text-muted-foreground">{item.actionPlan.verificationResult}</p></div>}
              </div>
            )}

            {(item.actionPlan?.observations || item.actionPlan?.difficulties) && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Seguimiento</h4>
                {item.actionPlan.observations && <div className="mb-2"><span className="font-medium text-sm">Observaciones:</span><p className="text-sm text-muted-foreground">{item.actionPlan.observations}</p></div>}
                {item.actionPlan.difficulties && <div><span className="font-medium text-sm">Dificultades:</span><p className="text-sm text-muted-foreground">{item.actionPlan.difficulties}</p></div>}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asignación de Medidas</h1>
        <p className="text-muted-foreground">Planificación y seguimiento de medidas de control (DS 44)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><div><p className="text-sm font-medium">Total Medidas</p><p className="text-2xl font-bold">{stats.total}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><div><p className="text-sm font-medium">Completadas</p><p className="text-2xl font-bold">{stats.completed}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-600" /><div><p className="text-sm font-medium">En Ejecución</p><p className="text-2xl font-bold">{stats.inExecution}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-600" /><div><p className="text-sm font-medium">Críticas</p><p className="text-2xl font-bold">{stats.critical}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Progreso General</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Completado</span><span>{completionRate.toFixed(1)}%</span></div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {measures.filter(m => m.actionPlan?.status !== 'Completado').length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Medidas Pendientes</h2>
            {measures.filter(m => m.actionPlan?.status !== 'Completado').map(item => (
              <MeasureCard key={item.measure.id} item={item} />
            ))}
          </div>
        )}

        {measures.filter(m => m.actionPlan?.status === 'Completado').length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-600">Medidas Completadas</h2>
            {measures.filter(m => m.actionPlan?.status === 'Completado').map(item => (
              <MeasureCard key={item.measure.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {editingMeasure && (
        <PlanDialog
          isOpen={!!editingMeasure}
          onClose={() => setEditingMeasure(null)}
          plan={measures.find(m => m.measure.id === editingMeasure.measureId)?.actionPlan}
          measureDescription={editingMeasure.description}
          onSave={(plan) => {
            setRiskAnalyses(prev => prev.map(risk => {
              if (risk.id !== editingMeasure.riskId) return risk;
              return {
                ...risk,
                preventiveMeasures: risk.preventiveMeasures.map(measure =>
                  measure.id === editingMeasure.measureId
                    ? { ...measure, actionPlan: { ...plan, measureId: measure.id } }
                    : measure
                ),
              };
            }));
            setEditingMeasure(null);
          }}
        />
      )}
    </div>
  );
}
