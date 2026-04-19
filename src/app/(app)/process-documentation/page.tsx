"use client";

import React, { Suspense } from "react";
import Link from 'next/link';
import { useLaborsafe } from "@/hooks/useLaborsafe";
import { Button } from "@/components/ui/button";
import { Building, Info, ClipboardList, GanttChartSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProcessTable from "@/components/process/ProcessTable";

const ProcessForm = React.lazy(() => import('@/components/process/ProcessForm'));

export default function ProcessDocumentationPage() {
  const { activeCompany, activeProcessDocuments } = useLaborsafe();

  if (!activeCompany) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-6 h-6 text-muted-foreground" />
            Ninguna empresa activa
          </CardTitle>
          <CardDescription>
            Por favor, seleccione una empresa activa para documentar sus procesos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/company">
              <Info className="mr-2 h-4 w-4" />
              Ir a Gestión de Empresas
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentación de Procesos</h1>
          <p className="text-muted-foreground">Para la empresa: <strong>{activeCompany.name}</strong> ({activeCompany.economicActivity})</p>
        </div>

        {activeProcessDocuments && activeProcessDocuments.length > 0 ? (
          <ProcessTable />
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
                Sin procesos documentados
              </CardTitle>
              <CardDescription>
                Aún no ha añadido ningún proceso para {activeCompany.name}. Comience por documentar el primer proceso en el formulario adjunto.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <div className="sticky top-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GanttChartSquare className="w-6 h-6 text-accent" />
              Añadir Nuevo Proceso
            </CardTitle>
            <CardDescription>
              Complete los detalles del nuevo proceso y tarea para registrarlo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
              <ProcessForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
