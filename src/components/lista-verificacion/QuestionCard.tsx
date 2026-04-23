'use client'

import { useState } from 'react'
import { DS44Question } from '@/lib/ds44-data'
import { DS44Answer } from '@/lib/types'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { getTipificadorForQuestion } from '@/lib/ds44-tipificador-map'
import { calcMulta, CompanySize, Severity, clpLabel } from '@/lib/tipificador-utils'

interface QuestionCardProps {
  question: DS44Question
  answer: DS44Answer | undefined
  comment: string
  evidence: string
  onAnswer: (id: string, value: DS44Answer) => void
  onComment: (id: string, value: string) => void
  onEvidence: (id: string, value: string) => void
  companySize?: CompanySize
  severity?: Severity
  utmValue?: number
}

const ANSWER_STYLES: Record<DS44Answer, string> = {
  'Sí': 'bg-green-900/30 border-green-500 text-green-400',
  'No': 'bg-red-900/30 border-red-500 text-red-400',
  'N/A': 'bg-amber-900/30 border-amber-500 text-amber-400',
}

const CARD_BORDER: Record<DS44Answer, string> = {
  'Sí': 'border-l-green-500',
  'No': 'border-l-red-500',
  'N/A': 'border-l-amber-500',
}

export default function QuestionCard({
  question,
  answer,
  comment,
  evidence,
  onAnswer,
  onComment,
  onEvidence,
  companySize = 'pequeña',
  severity = 'grave',
  utmValue = 0,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const borderClass = answer ? CARD_BORDER[answer] : 'border-l-[#374151]'
  const tipificadorLinks = getTipificadorForQuestion(question.id)
  const showInfracciones = answer === 'No' && tipificadorLinks.length > 0

  return (
    <div className={`bg-[#111827] border border-[#1f2937] border-l-4 ${borderClass} rounded-lg p-4 transition-all`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 font-mono text-xs font-semibold bg-[#0a0a0a] text-gray-300 px-2 py-1 rounded">
          {question.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {question.isFUF && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-orange-900/30 border border-orange-700/50 text-orange-400">
                FUF
              </span>
            )}
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
              {question.reference}
            </span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{question.question}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {(['Sí', 'No', 'N/A'] as DS44Answer[]).map(opt => (
          <button
            key={opt}
            onClick={() => onAnswer(question.id, opt)}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-all ${
              answer === opt
                ? ANSWER_STYLES[opt]
                : 'bg-[#0a0a0a] border-[#374151] text-gray-400 hover:border-gray-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Infracciones tipificadas — solo cuando respuesta es "No" */}
      {showInfracciones && (
        <div className="mb-3 bg-red-950/20 border border-red-800/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">
              Posibles infracciones tipificadas
            </span>
          </div>
          {tipificadorLinks.map(r => {
            const m = calcMulta(r, companySize, severity)
            const clp = m.unit === 'UTM' && typeof m.value === 'number' && utmValue > 0
              ? clpLabel(m.value, utmValue)
              : ''
            return (
              <div key={String(r.codigo)} className="flex items-start gap-2 bg-[#0a0a0a]/50 rounded p-2">
                <span className="shrink-0 text-[10px] font-bold bg-red-900/60 text-red-300 border border-red-700/50 px-1.5 py-0.5 rounded font-mono">
                  {r.codigo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-300 leading-snug">{r.enunciado}</p>
                  {m.value !== 'N/D' && (
                    <p className="text-[11px] text-red-300 font-semibold mt-0.5">
                      Multa estimada: {m.value} {m.unit}
                      {clp && <span className="text-gray-400 font-normal ml-1">({clp})</span>}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Ocultar detalles' : 'Ver control y evidencia'}
      </button>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-[#1f2937]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1">Medida de control</p>
            <p className="text-xs text-gray-400 leading-relaxed">{question.control}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1">Evidencia requerida</p>
            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{question.evidence}</p>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <textarea
          value={comment}
          onChange={e => onComment(question.id, e.target.value)}
          placeholder="Observaciones..."
          rows={2}
          className="w-full bg-[#0a0a0a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
        />
        <input
          type="text"
          value={evidence}
          onChange={e => onEvidence(question.id, e.target.value)}
          placeholder="Referencia de evidencia (nombre de documento, fecha, etc.)"
          className="w-full bg-[#0a0a0a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  )
}
