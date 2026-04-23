'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, Building2, FileText, BarChart3, ClipboardList, Package, LogOut, CheckSquare, Scale } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ROUTES } from '@/lib/routes';

const features = [
  { icon: Building2, title: 'Empresas', description: 'Gestión de perfiles de empresa', href: ROUTES.COMPANY, color: 'text-blue-400' },
  { icon: FileText, title: 'Documentación de Procesos', description: 'Registrar procesos y tareas', href: ROUTES.PROCESS_DOCUMENTATION, color: 'text-green-400' },
  { icon: ShieldCheck, title: 'Matriz de Riesgos', description: 'Identificar y evaluar riesgos con IA', href: ROUTES.RISK_MATRIX, color: 'text-yellow-400' },
  { icon: BarChart3, title: 'Dashboard', description: 'Visualización y análisis de datos', href: ROUTES.DASHBOARD_MATRIZ, color: 'text-purple-400' },
  { icon: ClipboardList, title: 'Plan de Acción', description: 'Asignación y seguimiento de medidas', href: ROUTES.ACTION_PLAN, color: 'text-orange-400' },
  { icon: Package, title: 'Adquisiciones', description: 'Consolidar necesidades de compra', href: ROUTES.ADQUISICIONES, color: 'text-pink-400' },
  { icon: CheckSquare, title: 'Lista de Verificación DS N°44', description: 'Autoevaluación de cumplimiento en SST', href: ROUTES.LISTA_VERIFICACION, color: 'text-teal-400' },
  { icon: Scale, title: 'Tipificador DT', description: 'Calculadora de multas según Código del Trabajo', href: ROUTES.TIPIFICADOR, color: 'text-red-400' },
];

export default function DashboardPage() {
  const { user, loading, handleLogout } = useAuthGuard();
  const router = useRouter();

  if (loading || !user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#1f2937] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-blue-500" />
          <h1 className="text-xl font-bold text-white">
            LaborSafe <span className="text-blue-500">G</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user.photoURL && (
            <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span className="text-sm text-gray-400">{user.displayName ?? user.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bienvenido{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h2>
          <p className="text-gray-400">Seleccioná un módulo para comenzar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="text-left p-6 rounded-2xl border border-[#1f2937] bg-[#111827] hover:border-blue-500/50 hover:bg-[#1a2236] transition-all group"
            >
              <Icon className={`w-8 h-8 mb-4 ${color} group-hover:scale-110 transition-transform`} />
              <h3 className="text-white font-semibold mb-1">{title}</h3>
              <p className="text-gray-400 text-sm">{description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
