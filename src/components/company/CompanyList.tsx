"use client"

import React, { useState, Suspense } from "react"
import { useLaborsafe } from "@/hooks/useLaborsafe"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Edit, Trash2, CheckCircle, MapPin, Briefcase, Users, User, Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { Company } from "@/lib/types"

const CompanyForm = React.lazy(() => import('./CompanyForm'))

export default function CompanyList() {
  const { companies, activeCompanyId, setActiveCompanyId, deleteCompany } = useLaborsafe()
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  return (
    <>
      <div className="grid gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-3">
                  <Building className="w-6 h-6 text-muted-foreground" />
                  {company.name}
                </CardTitle>
                {activeCompanyId === company.id && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activa
                  </Badge>
                )}
              </div>
              <CardDescription className="pl-9">{company.rut}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 text-sm pl-9">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{company.address}, {company.commune}</span>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{company.economicActivity}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{company.numWorkers} trabajadores</span>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{company.responsible}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button
                variant={activeCompanyId === company.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCompanyId(company.id)}
                disabled={activeCompanyId === company.id}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {activeCompanyId === company.id ? "Activa" : "Activar"}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditingCompany(company)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará permanentemente "{company.name}" y todos sus datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCompany(company.id)} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Suspense fallback={<div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <CompanyForm
          isOpen={!!editingCompany}
          setIsOpen={(open) => !open && setEditingCompany(null)}
          companyToEdit={editingCompany}
          onClose={() => setEditingCompany(null)}
        />
      </Suspense>
    </>
  )
}
