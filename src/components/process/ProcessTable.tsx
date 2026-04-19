"use client"

import React, { useState, Suspense } from "react"
import { useLaborsafe } from "@/hooks/useLaborsafe"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ProcessDocument } from "@/lib/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const ProcessForm = React.lazy(() => import('./ProcessForm'))

export default function ProcessTable() {
  const { activeProcessDocuments, deleteProcessDocument } = useLaborsafe()
  const [editingDoc, setEditingDoc] = useState<ProcessDocument | null>(null)
  const [viewingDoc, setViewingDoc] = useState<ProcessDocument | null>(null)

  return (
    <>
      <div className="rounded-lg border">
        <ScrollArea className="h-[75vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Proceso</TableHead>
                <TableHead>Tarea</TableHead>
                <TableHead>Rutinaria</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeProcessDocuments.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.process}</TableCell>
                  <TableCell>{doc.taskName}</TableCell>
                  <TableCell><Badge variant={doc.isRoutine ? "secondary" : "outline"}>{doc.isRoutine ? "Sí" : "No"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setViewingDoc(doc)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingDoc(doc)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará permanentemente el proceso "{doc.process}" con la tarea "{doc.taskName}".</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProcessDocument(doc.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <Suspense fallback={<div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <ProcessForm
          isOpen={!!editingDoc}
          setIsOpen={open => !open && setEditingDoc(null)}
          docToEdit={editingDoc}
          onClose={() => setEditingDoc(null)}
        />
      </Suspense>

      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingDoc.taskName}</DialogTitle>
              <DialogDescription>Detalles del proceso documentado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p><strong>Proceso:</strong> {viewingDoc.process}</p>
              <p><strong>Descripción:</strong> {viewingDoc.processDescription}</p>
              <p><strong>Puestos:</strong> {viewingDoc.jobPositionsInvolved}</p>
              <p><strong>Descripción Tarea:</strong> {viewingDoc.taskDescription}</p>
              <p><strong>Ubicación:</strong> {viewingDoc.specificLocation}</p>
              <p><strong>N° Trabajadores:</strong> {viewingDoc.numberOfWorkers}</p>
              <p><strong>Composición:</strong> {viewingDoc.sexGenderIdentities}</p>
              <p><strong>Rutinaria:</strong> {viewingDoc.isRoutine ? "Sí" : "No"}</p>
              {viewingDoc.frequency && <p><strong>Frecuencia:</strong> {viewingDoc.frequency}</p>}
              {viewingDoc.duration && <p><strong>Duración:</strong> {viewingDoc.duration}</p>}
              {viewingDoc.tools && <p><strong>Herramientas:</strong> {viewingDoc.tools}</p>}
              {viewingDoc.materials && <p><strong>Materiales:</strong> {viewingDoc.materials}</p>}
              {viewingDoc.environmentalConditions && <p><strong>Condiciones:</strong> {viewingDoc.environmentalConditions}</p>}
              {viewingDoc.requiredTraining && <p><strong>Capacitación:</strong> {viewingDoc.requiredTraining}</p>}
              {viewingDoc.observations && <p><strong>Observaciones:</strong> {viewingDoc.observations}</p>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
