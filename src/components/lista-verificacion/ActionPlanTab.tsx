'use client'

import { useState } from 'react'
import { DS44Section } from '@/lib/ds44-data'
import { DS44Answer } from '@/lib/types'

interface ActionRow {
  questionId: string
  sectionTitle: string
  question: string
  isFUF: boolean
  reference: string
  control: string
  responsible: string
  deadline: string
  status: 'Pendiente' | 'En proceso' | 'Completado'
}

interface ActionPlanTabProps {
  sections: DS44Section[]
  answers: Record<string, DS44Answer>
  comments: Record<string, string>
}

const STATUS_STYLES = {
  Pendiente: 'bg-red-900/30 text-red-400 border-red-700/50',
  'En proceso': 'bg-amber-900/30 text-amber-400 border-amber-700/50',
  Completado: 'bg-green-900/30 text-green-400 border-green-700/50',
}

export default function ActionPlanTab({ sections, answers, comments }: ActionPlanTabProps) {
  const [rows, setRows] = useState<Record<string, { responsible: string; deadline: string; status: ActionRow['status'] }>>({})

  const failedItems = sections.flatMap(s =>
    s.questions
      .filter(q => answers[q.id] === 'No')
      .map(q => ({ ...q, sectionTitle: s.title }))
  )

  const updateRow = (id: string, field: string, value: string) => {
    setRows(prev => ({ ...prev, [id]: { ...(prev[id] || { responsible: '', deadline: '', status: 'Pendiente' as const }), [field]: value } }))
  }

  const exportCSV = () => {
    const headers = ['ID', 'Sección', 'Requisito', 'Referencia', 'FUF', 'Observación', 'Responsable', 'Plazo', 'Estado']
    const data = failedItems.map(item => {
      const row = rows[item.id] || { responsible: '', deadline: '', status: 'Pendiente' }
      return [
        item.id,
        item.sectionTitle,
        item.question.replace(/\n/g, ' '),
        item.reference,
        item.isFUF ? 'Sí' : 'No',
        comments[item.id] || '',
        row.responsible,
        row.deadline,
        row.status,
      ]
    })
    const csv = [headers, ...data].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan_accion_ds44.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (failedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-900/20 border border-green-700/30 flex items-center justify-center mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <p className="text-gray-400">No hay ítems no conformes</p>
        <p className="text-gray-600 text-sm mt-1">Todos los ítems respondidos cumplen o no aplican</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Plan de acción correctivo</h3>
          <p className="text-sm text-gray-400 mt-0.5">{failedItems.length} ítem{failedItems.length !== 1 ? 's' : ''} no conforme{failedItems.length !== 1 ? 's' : ''} requieren acción</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#111827] border border-[#374151] rounded hover:border-gray-500 text-gray-300 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      <div className="space-y-3">
        {failedItems.map(item => {
          const row = rows[item.id] || { responsible: '', deadline: '', status: 'Pendiente' as const }
          return (
            <div key={item.id} className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 font-mono text-xs font-semibold bg-red-900/30 text-red-400 px-2 py-1 rounded">
                  {item.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.isFUF && (
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-orange-900/30 border border-orange-700/50 text-orange-400">
                        FUF
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{item.reference}</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{item.question.split('\n')[0]}</p>
                  {comments[item.id] && (
                    <p className="text-xs text-amber-400/80 mt-1 italic">Obs: {comments[item.id]}</p>
                  )}
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded p-3 mb-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1">Medida requerida</p>
                <p className="text-xs text-gray-400">{item.control}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Responsable</label>
                  <input
                    type="text"
                    value={row.responsible}
                    onChange={e => updateRow(item.id, 'responsible', e.target.value)}
                    placeholder="Nombre / cargo"
                    className="w-full bg-[#0a0a0a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Plazo</label>
                  <input
                    type="date"
                    value={row.deadline}
                    onChange={e => updateRow(item.id, 'deadline', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Estado</label>
                  <select
                    value={row.status}
                    onChange={e => updateRow(item.id, 'status', e.target.value as ActionRow['status'])}
                    className="w-full bg-[#0a0a0a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>Completado</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
