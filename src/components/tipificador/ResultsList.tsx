'use client';

import { Registro } from '@/lib/tipificador-utils';

interface Props {
  items: Registro[];
  selectedCodigo: string | null;
  actaCodigos: Set<string>;
  onSelect: (codigo: string) => void;
}

export default function ResultsList({ items, selectedCodigo, actaCodigos, onSelect }: Props) {
  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-8 text-sm">Sin resultados</p>;
  }

  return (
    <div className="flex flex-col">
      {items.map(r => {
        const code = String(r.codigo);
        const isActive = selectedCodigo === code;
        const inActa = actaCodigos.has(code);

        let bg = 'hover:bg-[#1a2236]';
        let border = '';
        if (isActive && inActa) { bg = 'bg-[#14532d]/30'; border = 'border-l-2 border-green-500'; }
        else if (isActive) { bg = 'bg-[#1e3a5f]'; border = 'border-l-2 border-blue-500'; }
        else if (inActa) { bg = 'bg-[#14532d]/20 hover:bg-[#14532d]/30'; border = 'border-l-2 border-green-700'; }

        return (
          <div
            key={code}
            className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-[#1f2937] ${bg} ${border}`}
            onClick={() => onSelect(code)}
          >
            <div className="flex gap-2 items-start">
              <span className="shrink-0 mt-0.5 text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                {r.codigo}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-200 line-clamp-2 leading-tight">
                  {r.enunciado || r.tipificacion || '—'}
                </p>
                {r.norma && (
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{r.norma}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
