"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useLaborsafe } from "@/hooks/useLaborsafe"
import type { Company } from "@/lib/types"

const companySchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  rut: z.string().min(1, "El RUT es requerido."),
  address: z.string().min(1, "La dirección es requerida."),
  commune: z.string().min(1, "La comuna es requerida."),
  economicActivity: z.string().min(1, "La actividad económica es requerida."),
  numWorkers: z.coerce.number().min(1, "Debe haber al menos un trabajador."),
  responsible: z.string().min(1, "El responsable es requerido."),
})

interface CompanyFormProps {
  isOpen?: boolean
  setIsOpen?: (isOpen: boolean) => void
  companyToEdit?: Company | null
  onClose?: () => void
}

export default function CompanyForm({ isOpen, setIsOpen, companyToEdit, onClose }: CompanyFormProps) {
  const { addCompany, updateCompany } = useLaborsafe()

  const form = useForm<z.infer<typeof companySchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(companySchema) as any,
    defaultValues: { name: "", rut: "", address: "", commune: "", economicActivity: "", numWorkers: 1, responsible: "" },
  })

  useEffect(() => {
    if (companyToEdit) {
      form.reset(companyToEdit)
    } else {
      form.reset({ name: "", rut: "", address: "", commune: "", economicActivity: "", numWorkers: 1, responsible: "" })
    }
  }, [companyToEdit, form, isOpen])

  function onSubmit(values: z.infer<typeof companySchema>) {
    if (companyToEdit) {
      updateCompany({ ...values, id: companyToEdit.id })
    } else {
      addCompany(values)
    }
    handleClose()
  }

  const handleClose = () => {
    form.reset()
    setIsOpen?.(false)
    onClose?.()
  }

  const populateWithTestData = () => {
    addCompany({
      name: "Metalmecánica Industrial SPA", rut: "77.456.789-1",
      address: "Parque Industrial Los Libertadores, Lote 5", commune: "Colina",
      economicActivity: "Fabricación de estructuras metálicas", numWorkers: 42, responsible: "Roberto Castillo",
    })
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nombre de la Empresa</FormLabel><FormControl><Input placeholder="Mi Empresa S.A." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="rut" render={({ field }) => (
            <FormItem><FormLabel>RUT</FormLabel><FormControl><Input placeholder="76.123.456-7" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Av. Siempre Viva 123" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="commune" render={({ field }) => (
            <FormItem><FormLabel>Comuna</FormLabel><FormControl><Input placeholder="Santiago" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="numWorkers" render={({ field }) => (
            <FormItem><FormLabel>N° de Trabajadores</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="economicActivity" render={({ field }) => (
          <FormItem><FormLabel>Actividad Económica</FormLabel><FormControl><Input placeholder="Desarrollo de Software" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="responsible" render={({ field }) => (
          <FormItem><FormLabel>Responsable</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="outline" onClick={populateWithTestData}>
            Añadir datos de prueba
          </Button>
          <div>
            {companyToEdit ? (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
              </DialogFooter>
            ) : (
              <Button type="submit">Añadir Empresa</Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )

  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{companyToEdit ? "Editar Empresa" : "Añadir Nueva Empresa"}</DialogTitle>
            <DialogDescription>Complete los detalles de la empresa a continuación.</DialogDescription>
          </DialogHeader>
          <div className="py-4">{formContent}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return formContent
}
