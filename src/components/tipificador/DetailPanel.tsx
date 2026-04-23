'use client';

import { Registro, MultaResult, clpLabel, SEVERITY_LABELS, Severity } from '@/lib/tipificador-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';

interface Props {
  record: Registro | null;
  multa: MultaResult | null;
  utmValue: number;
  severity: Severity;
  inActa: boolean;
  onToggleActa: () => void;
}

export default function DetailPanel({ record, multa, utmValue, severity, inActa, onToggleActa }: Props) {
  if (!record) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Seleccione un registro para ver el detalle
      </div>
    );
  }

  const clp = multa?.unit === 'UTM' && typeof multa.value === 'number'
    ? clpLabel(multa.value, utmValue)
    : '';

  const sevBadge: Record<Severity, string> = {
    leve: 'bg-green-900/40 text-green-400 border-green-700',
    grave: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
    gravisima: 'bg-red-900/40 text-red-400 border-red-700',
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
          {record.codigo}
        </span>
        <Badge variant="outline" className={`text-[11px] ${sevBadge[severity]}`}>
          {SEVERITY_LABELS[severity]}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        {record.norma && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Norma</span>
            <p className="text-gray-300 mt-0.5">{record.norma}</p>
          </div>
        )}
        {record.enunciado && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enunciado</span>
            <p className="text-gray-300 mt-0.5">{record.enunciado}</p>
          </div>
        )}
        {record.tipificacion && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipificación</span>
            <p className="text-gray-400 mt-0.5 text-xs leading-relaxed">{record.tipificacion}</p>
          </div>
        )}
        {record.naturaleza != null && (
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Naturaleza</span>
            <p className="text-gray-300 mt-0.5">{record.naturaleza}</p>
          </div>
        )}
      </div>

      {multa && (
        <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mb-1">Multa calculada</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-blue-300">{String(multa.value)}</span>
            <span className="text-sm text-gray-400">{multa.unit}</span>
          </div>
          {clp && <p className="text-xs text-gray-400 mt-0.5">{clp}</p>}
        </div>
      )}

      <Button
        size="sm"
        variant={inActa ? 'destructive' : 'default'}
        className="w-full"
        onClick={onToggleActa}
      >
        {inActa ? <><Minus className="w-3 h-3 mr-1" />Quitar del acta</> : <><Plus className="w-3 h-3 mr-1" />Añadir al acta</>}
      </Button>
    </div>
  );
}
