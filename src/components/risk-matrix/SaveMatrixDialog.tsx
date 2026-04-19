"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLaborsafe } from "@/hooks/useLaborsafe"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const saveSchema = z.object({ name: z.string().min(1, "El nombre de la matriz es requerido.") })

interface SaveMatrixDialogProps { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }

export default function SaveMatrixDialog({ isOpen, setIsOpen }: SaveMatrixDialogProps) {
  const { saveCurrentMatrix } = useLaborsafe()
  const form = useForm<z.infer<typeof saveSchema>>({
    resolver: zodResolver(saveSchema),
    defaultValues: { name: `Matriz - ${new Date().toLocaleDateString('es-CL')}` },
  })

  const handleClose = () => { form.reset(); setIsOpen(false) }

  function onSubmit(values: z.infer<typeof saveSchema>) {
    saveCurrentMatrix(values.name)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar Matriz de Riesgo</DialogTitle>
          <DialogDescription>Asigne un nombre a esta versión de la matriz para guardarla en el historial.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Matriz</FormLabel>
                <FormControl><Input placeholder="Ej: Matriz de Riesgo Q1 2024" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit">Guardar en Historial</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
