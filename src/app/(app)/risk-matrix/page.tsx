"use client";

import { useLaborsafe } from "@/hooks/useLaborsafe";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Info, Link as LinkIcon, Sparkles, Loader2, Save, ClipboardList, CheckSquare, Lightbulb, FileSpreadsheet, FileText, Wand, Trash2, Undo } from "lucide-react";
import RiskMatrixTable from "@/components/risk-matrix/RiskMatrixTable";
import SaveMatrixDialog from "@/components/risk-matrix/SaveMatrixDialog";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RiskMatrixPage() {
  const {
    activeCompany,
    activeProcessDocuments,
    riskAnalyses,
    syncProcessesToMatrix,
    identifyRisksWithAI,
    evaluateRisksWithAI,
    suggestAllControlMeasuresWithAI,
    runFullAIMatrix,
    clearActiveMatrix,
    clearAllPreventiveMeasures,
    clearAllEvaluations,
    loadingAI,
    exportToExcel,
    exportToPDF,
    lastDeletedRisk,
    undoDeleteRiskAnalysis,
  } = useLaborsafe();

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-row');
        setTimeout(() => element.classList.remove('highlight-row'), 10000);
      }
    }
  }, []);

  if (!activeCompany) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-6 h-6 text-muted-foreground" />
            Ninguna empresa activa
          </CardTitle>
          <CardDescription>Por favor, seleccione una empresa activa para crear una matriz de riesgo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/company"><Info className="mr-2 h-4 w-4" />Ir a Gestión de Empresas</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (activeProcessDocuments.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-muted-foreground" />
            Sin procesos documentados
          </CardTitle>
          <CardDescription>
            Debe documentar al menos un proceso para {activeCompany.name} antes de poder generar una matriz de riesgo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/process-documentation"><Info className="mr-2 h-4 w-4" />Documentar Procesos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generador de Matriz de Riesgos</h1>
          <p className="text-muted-foreground">Para la empresa: <strong>{activeCompany.name}</strong> ({activeCompany.economicActivity})</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {lastDeletedRisk && (
            <Button onClick={undoDeleteRiskAnalysis} variant="outline">
              <Undo className="mr-2 h-4 w-4" />Deshacer Borrado
            </Button>
          )}
          <Button onClick={syncProcessesToMatrix} variant="outline" disabled={loadingAI}>
            <LinkIcon className="mr-2 h-4 w-4" />Sincroniza los Procesos
          </Button>
          <Button onClick={() => runFullAIMatrix(1)} disabled={loadingAI}>
            {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
            Matriz completa con IA
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de IA</CardTitle>
          <CardDescription>
            Ajuste cómo la IA asiste en la creación de la matriz. Puede ejecutar todos los pasos a la vez o hacerlo paso a paso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Pasos individuales:</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => identifyRisksWithAI()} disabled={loadingAI} variant="outline">
                {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                1. Identificar Peligros
              </Button>
              <Button onClick={() => evaluateRisksWithAI(riskAnalyses)} disabled={loadingAI} variant="outline">
                {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                2. Evaluar Riesgos
              </Button>
              <Button onClick={() => suggestAllControlMeasuresWithAI(riskAnalyses, false)} disabled={loadingAI} variant="outline">
                {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                3. Completar Medidas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <RiskMatrixTable />

        {riskAnalyses.length > 0 && (
          <div className="flex justify-end gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />Borrar Evaluaciones
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Borrar todas las evaluaciones?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción eliminará todas las evaluaciones de riesgos. Los peligros y medidas se mantendrán.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllEvaluations} className="bg-destructive hover:bg-destructive/90">Sí, borrar evaluaciones</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />Borrar Medidas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Borrar todas las medidas preventivas?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción eliminará todas las medidas preventivas de todos los riesgos en la matriz.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllPreventiveMeasures} className="bg-destructive hover:bg-destructive/90">Sí, borrar medidas</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />Limpiar Matriz
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de que quiere limpiar la matriz?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción eliminará todos los datos de la matriz de riesgo actual, incluyendo peligros, evaluaciones y medidas.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearActiveMatrix} className="bg-destructive hover:bg-destructive/90">Sí, limpiar matriz</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar a Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />Exportar a PDF
            </Button>
            <Button size="lg" onClick={() => setIsSaveDialogOpen(true)}>
              <Save className="mr-2 h-4 w-4" />Guardar Matriz en Historial
            </Button>
          </div>
        )}
      </div>

      <SaveMatrixDialog isOpen={isSaveDialogOpen} setIsOpen={setIsSaveDialogOpen} />
    </div>
  );
}
