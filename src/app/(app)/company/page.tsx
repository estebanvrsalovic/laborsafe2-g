'use client'

import { useState } from 'react'
import { useLaborsafe } from '@/hooks/useLaborsafe'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import ModuleLayout from '@/components/ModuleLayout'
import CompanyList from '@/components/company/CompanyList'
import CompanyForm from '@/components/company/CompanyForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function CompanyPage() {
  const { loading } = useAuthGuard()
  const { companies } = useLaborsafe()
  const [isFormOpen, setIsFormOpen] = useState(false)

  if (loading) return <LoadingSpinner />

  return (
    <ModuleLayout
      title="Gestión de Empresas"
      description="Administra las empresas para las que realizas evaluaciones de riesgo"
      backHref="/dashboard"
      headerAction={
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
        </Button>
      }
    >
      {companies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No tienes empresas registradas aún.</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Primera Empresa
          </Button>
        </div>
      ) : (
        <CompanyList />
      )}

      <CompanyForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />
    </ModuleLayout>
  )
}
