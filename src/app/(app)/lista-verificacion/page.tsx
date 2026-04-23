'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLaborsafe } from '@/hooks/useLaborsafe'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import ModuleLayout from '@/components/ModuleLayout'
import QuestionCard from '@/components/lista-verificacion/QuestionCard'
import SectionNav from '@/components/lista-verificacion/SectionNav'
import ResultsTab from '@/components/lista-verificacion/ResultsTab'
import ActionPlanTab from '@/components/lista-verificacion/ActionPlanTab'
import { DS44_SECTIONS, ALL_QUESTIONS } from '@/lib/ds44-data'
import { DS44Answer, DS44Identification, DS44Checklist } from '@/lib/types'
import { AlertTriangle, Download, RefreshCw, Trash2 } from 'lucide-react'
import { CompanySize, Severity } from '@/lib/tipificador-utils'

const EMPTY_IDENTIFICATION: DS44Identification = {
  empresa: '',
  rut: '',
  actividad: '',
  direccion: '',
  evaluador: '',
  cargo: '',
  fecha: '',
  organismo: '',
}

type ActiveTab = 'identificacion' | 'evaluacion' | 'resultados' | 'plan'

export default function ListaVerificacionPage() {
  const { activeCompany } = useLaborsafe()
  const { user } = useAuthGuard()

  const [activeTab, setActiveTab] = useState<ActiveTab>('identificacion')
  const [activeSection, setActiveSection] = useState(DS44_SECTIONS[0].letter)
  const [identification, setIdentification] = useState<DS44Identification>(EMPTY_IDENTIFICATION)
  const [answers, setAnswers] = useState<Record<string, DS44Answer>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [evidence, setEvidence] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [companySize, setCompanySize] = useState<CompanySize>('pequeña')
  const [severity, setSeverity] = useState<Severity>('grave')
  const [utmInput, setUtmInput] = useState('69542')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const docId = activeCompany ? `${activeCompany.id}_${user?.uid}` : null

  // Load from Firestore
  useEffect(() => {
    if (!docId) { setLoaded(true); return }
    getDoc(doc(db, 'ds44Checklists', docId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as DS44Checklist
        setIdentification(data.identification || EMPTY_IDENTIFICATION)
        setAnswers(data.answers || {})
        setComments(data.comments || {})
        setEvidence(data.evidence || {})
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [docId])

  // Auto-save debounced
  const save = useCallback(
    (id: string | null, uid: string | undefined, ident: DS44Identification, ans: Record<string, DS44Answer>, cmts: Record<string, string>, ev: Record<string, string>) => {
      if (!id || !uid) return
      setSaving(true)
      setDoc(doc(db, 'ds44Checklists', id), {
        id,
        userId: uid,
        companyId: activeCompany?.id || '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        identification: ident,
        answers: ans,
        comments: cmts,
        evidence: ev,
      } satisfies DS44Checklist, { merge: true })
        .finally(() => setSaving(false))
    },
    [activeCompany?.id]
  )

  const scheduleSave = useCallback((ident: DS44Identification, ans: Record<string, DS44Answer>, cmts: Record<string, string>, ev: Record<string, string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(docId, user?.uid, ident, ans, cmts, ev), 1200)
  }, [docId, user?.uid, save])

  const handleAnswer = useCallback((id: string, value: DS44Answer) => {
    setAnswers(prev => {
      const next = { ...prev, [id]: value }
      scheduleSave(identification, next, comments, evidence)
      return next
    })
  }, [identification, comments, evidence, scheduleSave])

  const handleComment = useCallback((id: string, value: string) => {
    setComments(prev => {
      const next = { ...prev, [id]: value }
      scheduleSave(identification, answers, next, evidence)
      return next
    })
  }, [identification, answers, evidence, scheduleSave])

  const handleEvidence = useCallback((id: string, value: string) => {
    setEvidence(prev => {
      const next = { ...prev, [id]: value }
      scheduleSave(identification, answers, comments, next)
      return next
    })
  }, [identification, answers, comments, scheduleSave])

  const handleIdentification = useCallback((field: keyof DS44Identification, value: string) => {
    setIdentification(prev => {
      const next = { ...prev, [field]: value }
      scheduleSave(next, answers, comments, evidence)
      return next
    })
  }, [answers, comments, evidence, scheduleSave])

  const handleClear = useCallback(() => {
    setAnswers({})
    setComments({})
    setEvidence({})
    setConfirmClear(false)
    save(docId, user?.uid, identification, {}, {}, {})
  }, [docId, user?.uid, identification, save])

  const utmValue = useMemo(() => {
    const v = parseFloat(utmInput.replace(/[^0-9.]/g, ''))
    return isNaN(v) ? 0 : v
  }, [utmInput])

  const { globalPct, answeredCount } = useMemo(() => {
    const vals = Object.values(answers)
    const yes = vals.filter(a => a === 'Sí').length
    const applicable = vals.filter(a => a === 'Sí' || a === 'No').length
    return {
      answeredCount: vals.length,
      globalPct: applicable > 0 ? Math.round((yes / applicable) * 100) : 0,
    }
  }, [answers])

  const exportCSV = () => {
    const headers = ['ID', 'Sección', 'Pregunta', 'Referencia', 'FUF', 'Respuesta', 'Observación', 'Evidencia']
    const rows = ALL_QUESTIONS.map(q => {
      const section = DS44_SECTIONS.find(s => s.questions.some(sq => sq.id === q.id))
      return [
        q.id,
        section?.title || '',
        q.question.replace(/\n/g, ' '),
        q.reference,
        q.isFUF ? 'Sí' : 'No',
        answers[q.id] || '',
        comments[q.id] || '',
        evidence[q.id] || '',
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista_verificacion_ds44${activeCompany ? `_${activeCompany.name}` : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'identificacion', label: 'Identificación' },
    { id: 'evaluacion', label: `Evaluación (${answeredCount}/${ALL_QUESTIONS.length})` },
    { id: 'resultados', label: 'Resultados' },
    { id: 'plan', label: 'Plan de acción' },
  ]

  if (!loaded) {
    return (
      <ModuleLayout title="Lista de Verificación DS N°44" description="Autoevaluación SST">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </ModuleLayout>
    )
  }

  return (
    <ModuleLayout
      title="Lista de Verificación DS N°44"
      description="Autoevaluación de cumplimiento en SST"
      headerAction={
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-gray-500 animate-pulse">Guardando…</span>}
          {!activeCompany && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/20 border border-amber-700/40 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              Sin empresa activa
            </span>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#111827] border border-[#374151] rounded hover:border-gray-500 text-gray-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      }
    >
      <div className="border-b border-[#1f2937] mb-6 -mx-0">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'identificacion' && (
        <div className="max-w-2xl">
          <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6">
            <h2 className="text-white font-semibold mb-4">Datos de identificación</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['empresa', 'Razón social / Nombre empresa'],
                ['rut', 'RUT empresa'],
                ['actividad', 'Actividad económica'],
                ['direccion', 'Dirección'],
                ['evaluador', 'Nombre evaluador/a'],
                ['cargo', 'Cargo evaluador/a'],
                ['fecha', 'Fecha de evaluación'],
                ['organismo', 'Organismo administrador'],
              ] as [keyof DS44Identification, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{label}</label>
                  <input
                    type={field === 'fecha' ? 'date' : 'text'}
                    value={identification[field]}
                    onChange={e => handleIdentification(field, e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              ))}
            </div>
            {activeCompany && (
              <button
                onClick={() => {
                  const next: DS44Identification = {
                    ...identification,
                    empresa: activeCompany.name,
                    rut: activeCompany.rut,
                    actividad: activeCompany.economicActivity,
                    direccion: `${activeCompany.address}, ${activeCompany.commune}`,
                  }
                  setIdentification(next)
                  scheduleSave(next, answers, comments, evidence)
                }}
                className="mt-4 text-sm text-teal-400 hover:text-teal-300 underline transition-colors"
              >
                Completar desde empresa activa
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'evaluacion' && (
        <div className="space-y-4">
          {/* Configuración para cálculo de multas */}
          <div className="flex flex-wrap items-center gap-3 bg-[#111827] border border-[#1f2937] rounded-lg px-4 py-3">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">Multas estimadas:</span>
            <select
              value={companySize}
              onChange={e => setCompanySize(e.target.value as CompanySize)}
              className="text-xs bg-[#0a0a0a] border border-[#374151] rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="micro">Micro (1–9)</option>
              <option value="pequeña">Pequeña (10–49)</option>
              <option value="mediana">Mediana (50–199)</option>
              <option value="grande">Grande (200+)</option>
            </select>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as Severity)}
              className="text-xs bg-[#0a0a0a] border border-[#374151] rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="leve">Leve</option>
              <option value="grave">Grave</option>
              <option value="gravisima">Gravísima</option>
            </select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">UTM (CLP)</span>
              <input
                type="text"
                value={utmInput}
                onChange={e => setUtmInput(e.target.value)}
                className="w-24 text-xs bg-[#0a0a0a] border border-[#374151] rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-gray-600 italic">Se muestra cuando la respuesta es &quot;No&quot;</span>
          </div>

          <div className="flex justify-end">
            {confirmClear ? (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded px-3 py-2">
                <span className="text-sm text-red-300">¿Borrar todas las respuestas?</span>
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1 text-sm border border-[#374151] hover:border-gray-500 text-gray-400 rounded transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#374151] hover:border-red-700/60 text-gray-500 hover:text-red-400 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar evaluación
              </button>
            )}
          </div>
          <div className="flex gap-6">
          <SectionNav
            sections={DS44_SECTIONS}
            answers={answers}
            activeSection={activeSection}
            onSelect={setActiveSection}
            globalPct={globalPct}
            answeredCount={answeredCount}
            totalCount={ALL_QUESTIONS.length}
          />
          <div className="flex-1 min-w-0">
            {DS44_SECTIONS.filter(s => s.letter === activeSection).map(section => (
              <div key={section.letter}>
                <div className="flex items-baseline gap-3 mb-5 pb-3 border-b border-[#1f2937]">
                  <span className="text-5xl font-bold text-teal-500/30">{section.letter}</span>
                  <div>
                    <h2 className="text-white font-semibold text-lg">{section.title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      {section.questions.filter(q => answers[q.id]).length}/{section.questions.length} respondidas
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {section.questions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      answer={answers[q.id]}
                      comment={comments[q.id] || ''}
                      evidence={evidence[q.id] || ''}
                      onAnswer={handleAnswer}
                      onComment={handleComment}
                      onEvidence={handleEvidence}
                      companySize={companySize}
                      severity={severity}
                      utmValue={utmValue}
                    />
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  {DS44_SECTIONS.findIndex(s => s.letter === activeSection) < DS44_SECTIONS.length - 1 && (
                    <button
                      onClick={() => {
                        const idx = DS44_SECTIONS.findIndex(s => s.letter === activeSection)
                        setActiveSection(DS44_SECTIONS[idx + 1].letter)
                      }}
                      className="px-4 py-2 text-sm bg-teal-900/30 border border-teal-700/50 text-teal-400 rounded hover:bg-teal-900/50 transition-colors"
                    >
                      Siguiente sección →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {activeTab === 'resultados' && (
        <ResultsTab
          sections={DS44_SECTIONS}
          answers={answers}
          totalQuestions={ALL_QUESTIONS.length}
        />
      )}

      {activeTab === 'plan' && (
        <ActionPlanTab
          sections={DS44_SECTIONS}
          answers={answers}
          comments={comments}
        />
      )}
    </ModuleLayout>
  )
}
