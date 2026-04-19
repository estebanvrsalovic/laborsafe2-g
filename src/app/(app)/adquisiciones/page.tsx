"use client";

import { useMemo } from "react";
import { useLaborsafe } from "@/hooks/useLaborsafe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertTriangle, Download } from "lucide-react";
import { getRiskLevelColor } from "@/lib/constants";

type AcquisitionRow = {
  measureId: string;
  measureDescription: string;
  classification: string;
  riskLevel: string;
  process: string;
  task: string;
  responsible: string;
};

export default function AdquisicionesPage() {
  const { activeCompany, riskAnalyses } = useLaborsafe();

  const acquisitionRows = useMemo<AcquisitionRow[]>(() => {
    const buyKeywords = /compra|adquisición|adquirir|epp|equipo de protección|casco|guante|arnés|zapato|bota|chaleco|respirador|protector|extintor|señalética|señal|kit|botiquín|detector|sensor|alarma/i;
    return riskAnalyses.flatMap(risk =>
      risk.preventiveMeasures
        .filter(m => buyKeywords.test(m.description) || m.classification === 'EPP')
        .map(m => ({
          measureId: m.id,
          measureDescription: m.description,
          classification: m.classification,
          riskLevel: risk.security.riskLevel || '',
          process: risk.process,
          task: risk.taskName,
          responsible: m.responsible || '',
        }))
    );
  }, [riskAnalyses]);

  const exportCSV = () => {
    const headers = ['Descripción Medida', 'Clasificación', 'Nivel Riesgo', 'Proceso', 'Tarea', 'Responsable'];
    const rows = acquisitionRows.map(r => [r.measureDescription, r.classification, r.riskLevel, r.process, r.task, r.responsible]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCompany?.name || 'empresa'}_adquisiciones.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeCompany) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Adquisiciones</h1>
        <Card>
          <CardHeader><CardTitle>No hay empresa activa</CardTitle></CardHeader>
          <CardContent>Seleccione una empresa para ver las adquisiciones sugeridas desde la matriz de riesgos.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Adquisiciones</h1>
          <p className="text-muted-foreground">Consolidación de compras sugeridas a partir de las medidas de control de la matriz.</p>
        </div>
        {acquisitionRows.length > 0 && (
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Lista de Adquisiciones Sugeridas
          </CardTitle>
          <CardDescription>
            Medidas de control que implican compra de EPP, equipos o señalética identificadas en la matriz de riesgos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acquisitionRows.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <AlertTriangle className="w-5 h-5" />
              <p>No se encontraron medidas que requieran compras. Complete la matriz de riesgos con medidas de control primero.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 font-semibold text-sm border-b pb-2 text-muted-foreground">
                <div className="col-span-5">Descripción</div>
                <div className="col-span-2">Clasificación</div>
                <div className="col-span-2">Nivel Riesgo</div>
                <div className="col-span-3">Proceso / Tarea</div>
              </div>
              {acquisitionRows.map((row) => (
                <div key={row.measureId} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md hover:bg-muted/50 text-sm">
                  <div className="col-span-5 font-medium">{row.measureDescription}</div>
                  <div className="col-span-2">
                    <Badge variant="outline">{row.classification}</Badge>
                  </div>
                  <div className="col-span-2">
                    {row.riskLevel ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRiskLevelColor(row.riskLevel)}`}>
                        {row.riskLevel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin evaluar</span>
                    )}
                  </div>
                  <div className="col-span-3 text-muted-foreground">
                    <div>{row.process}</div>
                    <div className="text-xs">{row.task}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
