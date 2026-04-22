'use client'

import { DS44Section } from '@/lib/ds44-data'
import { DS44Answer } from '@/lib/types'

interface SectionNavProps {
  sections: DS44Section[]
  answers: Record<string, DS44Answer>
  activeSection: string
  onSelect: (letter: string) => void
  globalPct: number
  answeredCount: number
  totalCount: number
}

export default function SectionNav({
  sections,
  answers,
  activeSection,
  onSelect,
  globalPct,
  answeredCount,
  totalCount,
}: SectionNavProps) {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-3">
        <div className="bg-gradient-to-br from-teal-900/60 to-teal-800/40 border border-teal-700/50 rounded-lg p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-teal-400 mb-1">Cumplimiento global</p>
          <p className="text-4xl font-bold text-white">
            {answeredCount === 0 ? '—' : `${globalPct}%`}
          </p>
          <p className="text-xs text-teal-300/70 mt-1">
            {answeredCount}/{totalCount} respondidas
          </p>
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 px-1 mb-2">Secciones</p>
          {sections.map(section => {
            const sectionAnswers = section.questions.map(q => answers[q.id]).filter(Boolean)
            const yes = sectionAnswers.filter(a => a === 'Sí').length
            const no = sectionAnswers.filter(a => a === 'No').length
            const answered = sectionAnswers.length
            const total = section.questions.length
            const pct = answered > 0 ? Math.round((yes / answered) * 100) : null

            return (
              <button
                key={section.letter}
                onClick={() => onSelect(section.letter)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border ${
                  activeSection === section.letter
                    ? 'bg-teal-900/30 border-teal-700/50 text-white'
                    : 'bg-transparent border-transparent hover:bg-[#111827] text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className={`text-2xl font-bold leading-none w-7 flex-shrink-0 ${
                  activeSection === section.letter ? 'text-teal-400' : 'text-gray-600'
                }`}>
                  {section.letter}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight truncate">{section.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-gray-500">{answered}/{total}</span>
                    {no > 0 && (
                      <span className="font-mono text-[10px] text-red-400">{no} No</span>
                    )}
                    {pct !== null && (
                      <span className={`font-mono text-[10px] font-semibold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
