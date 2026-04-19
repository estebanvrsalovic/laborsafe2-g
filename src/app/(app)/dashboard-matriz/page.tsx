"use client";

import { useLaborsafe } from "@/hooks/useLaborsafe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Shield, CheckCircle, TrendingUp } from "lucide-react";

export default function RiskMatrixDashboard() {
  const { riskAnalyses, activeCompany } = useLaborsafe();

  const totalRisks = riskAnalyses.length;
  const risksByLevel = riskAnalyses.reduce((acc, risk) => {
    const level = risk.security.riskLevel || 'Sin evaluar';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const measuresStats = riskAnalyses.reduce((acc, risk) => {
    acc.total += risk.preventiveMeasures.length;
    acc.implemented += risk.preventiveMeasures.filter(m => m.status === 'Completado').length;
    acc.pending += risk.preventiveMeasures.filter(m => m.status === 'Pendiente').length;
    return acc;
  }, { total: 0, implemented: 0, pending: 0 });

  const riskDistribution = [
    { name: 'Alto', value: (risksByLevel['Alto'] || 0) + (risksByLevel['Crítico'] || 0) + (risksByLevel['Intolerable'] || 0) + (risksByLevel['Importante'] || 0), color: '#ef4444' },
    { name: 'Medio', value: (risksByLevel['Medio'] || 0) + (risksByLevel['Moderado'] || 0), color: '#eab308' },
    { name: 'Bajo', value: (risksByLevel['Bajo'] || 0) + (risksByLevel['Tolerable'] || 0), color: '#22c55e' },
  ];

  const riskTypeData = [
    { name: 'Seguridad', value: riskAnalyses.filter(r => r.security.riskLevel !== '').length },
    { name: 'Higiénico', value: riskAnalyses.filter(r => r.hygienic.riskLevel !== 'No aplica').length },
    { name: 'Psicosocial', value: riskAnalyses.filter(r => r.psychosocial.riskLevel !== 'No aplica').length },
    { name: 'Musculoesquelético', value: riskAnalyses.filter(r => r.musculoskeletal.riskLevel !== 'No aplica').length },
  ];

  const implementationProgress = measuresStats.total > 0
    ? (measuresStats.implemented / measuresStats.total) * 100
    : 0;

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Seleccione una empresa para ver el dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard - Matriz de Riesgos</h1>
        <p className="text-muted-foreground">Empresa: <strong>{activeCompany.name}</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riesgos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRisks}</div>
            <p className="text-xs text-muted-foreground">Riesgos identificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riesgos Críticos</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(risksByLevel['Crítico'] || 0) + (risksByLevel['Intolerable'] || 0) + (risksByLevel['Alto'] || 0) + (risksByLevel['Importante'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medidas Totales</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{measuresStats.total}</div>
            <p className="text-xs text-muted-foreground">Medidas de control definidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementación</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{implementationProgress.toFixed(0)}%</div>
            <Progress value={implementationProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Nivel de Riesgo</CardTitle>
            <CardDescription>Clasificación de riesgos de seguridad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riesgos por Tipo</CardTitle>
            <CardDescription>Distribución multidimensional</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Medidas de Control</CardTitle>
          <CardDescription>Progreso de implementación de medidas preventivas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{measuresStats.implemented}</div>
              <div className="text-sm text-muted-foreground">Implementadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{measuresStats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{measuresStats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {riskAnalyses.filter(r => ['Crítico', 'Intolerable', 'Alto', 'Importante'].includes(r.security.riskLevel)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riesgos Críticos - Atención Prioritaria</CardTitle>
            <CardDescription>Riesgos que requieren acción inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAnalyses
                .filter(r => ['Crítico', 'Intolerable', 'Alto', 'Importante'].includes(r.security.riskLevel))
                .slice(0, 5)
                .map(risk => (
                  <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-grow">
                      <div className="font-medium">{risk.process}</div>
                      <div className="text-sm text-muted-foreground">{risk.hazard}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={['Crítico', 'Intolerable'].includes(risk.security.riskLevel) ? 'destructive' : 'default'}>
                        {risk.security.riskLevel}
                      </Badge>
                      <Badge variant="outline">{risk.preventiveMeasures.length} medidas</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
