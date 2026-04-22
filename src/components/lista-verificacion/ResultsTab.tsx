'use client'

import { DS44Section } from '@/lib/ds44-data'
import { DS44Answer } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ResultsTabProps {
  sections: DS44Section[]
  answers: Record<string, DS44Answer>
  totalQuestions: number
}

export default function ResultsTab({ sections, answers, totalQuestions }: ResultsTabProps) {
  const allAnswers = Object.values(answers)
  const yes = allAnswers.filter(a => a === 'Sí').length
  const no = allAnswers.filter(a => a === 'No').length
  const na = allAnswers.filter(a => a === 'N/A').length
  const answered = allAnswers.length
  const unanswered = totalQuestions - answered
  const pct = answered > 0 ? Math.round((yes / answered) * 100) : 0

  const sectionData = sections.map(section => {
    const sectionAnswers = section.questions.map(q => answers[q.id]).filter(Boolean)
    const sYes = sectionAnswers.filter(a => a === 'Sí').length
    const sNo = sectionAnswers.filter(a => a === 'No').length
    const sNa = sectionAnswers.filter(a => a === 'N/A').length
    const sAnswered = sectionAnswers.length
    return {
      name: section.letter,
      fullName: section.title,
      Sí: sYes,
      No: sNo,
      'N/A': sNa,
      total: section.questions.length,
      answered: sAnswered,
      pct: sAnswered > 0 ? Math.round((sYes / sAnswered) * 100) : 0,
    }
  })

  const stats = [
    { label: 'Cumple', value: yes, color: 'text-green-400', border: 'border-green-500/40', bg: 'bg-green-900/10' },
    { label: 'No cumple', value: no, color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-900/10' },
    { label: 'No aplica', value: na, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-900/10' },
    { label: 'Sin responder', value: unanswered, color: 'text-gray-400', border: 'border-gray-600/40', bg: 'bg-gray-900/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-lg p-4`}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-2">{s.label}</p>
            <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">de {totalQuestions} preguntas</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-white font-semibold">Cumplimiento global</h3>
          <span className={`text-2xl font-bold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {answered === 0 ? '—' : `${pct}%`}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">{answered} respuestas registradas de {totalQuestions} totales</p>
        <div className="h-2 bg-[#1f2937] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Cumplimiento por sección</h3>
        <div className="space-y-3">
          {sectionData.map(s => (
            <div key={s.name} className="grid grid-cols-[40px_1fr_60px] items-center gap-3">
              <span className="font-mono text-sm font-bold text-gray-400">{s.name}</span>
              <div className="flex h-5 rounded overflow-hidden bg-[#1f2937]">
                {s.answered > 0 ? (
                  <>
                    {s.Sí > 0 && (
                      <div
                        className="bg-green-600 h-full"
                        style={{ width: `${(s.Sí / s.total) * 100}%` }}
                        title={`Sí: ${s.Sí}`}
                      />
                    )}
                    {s.No > 0 && (
                      <div
                        className="bg-red-600 h-full"
                        style={{ width: `${(s.No / s.total) * 100}%` }}
                        title={`No: ${s.No}`}
                      />
                    )}
                    {s['N/A'] > 0 && (
                      <div
                        className="bg-amber-600 h-full"
                        style={{ width: `${(s['N/A'] / s.total) * 100}%` }}
                        title={`N/A: ${s['N/A']}`}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-[#1f2937]" />
                )}
              </div>
              <span className={`text-right font-mono text-xs font-semibold ${
                s.pct >= 80 ? 'text-green-400' : s.pct >= 50 ? 'text-amber-400' : s.answered > 0 ? 'text-red-400' : 'text-gray-600'
              }`}>
                {s.answered > 0 ? `${s.pct}%` : '—'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-[#1f2937]">
          {[['bg-green-600', 'Cumple'], ['bg-red-600', 'No cumple'], ['bg-amber-600', 'N/A'], ['bg-[#1f2937]', 'Sin responder']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {no > 0 && (
        <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-3">Ítems no conformes ({no})</h3>
          <div className="space-y-1">
            {sections.flatMap(s =>
              s.questions
                .filter(q => answers[q.id] === 'No')
                .map(q => (
                  <div key={q.id} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded flex-shrink-0">{q.id}</span>
                    <span className="text-gray-300 text-xs">{q.question.split('\n')[0]}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
