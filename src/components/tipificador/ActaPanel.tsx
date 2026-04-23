'use client';

import {
  Registro, Severity, CompanySize,
  calcMulta, computeTotals, clpLabel, SEVERITY_LABELS,
} from '@/lib/tipificador-utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, Trash2, X } from 'lucide-react';

interface Props {
  acta: Record<string, Registro>;
  actaSeverity: Record<string, Severity>;
  companySize: CompanySize;
  severity: Severity;
  utmValue: number;
  onRemove: (codigo: string) => void;
  onClear: () => void;
  onSetSeverity: (codigo: string, sev: Severity) => void;
}

export default function ActaPanel({
  acta, actaSeverity, companySize, severity, utmValue,
  onRemove, onClear, onSetSeverity,
}: Props) {
  const items = Object.values(acta);

  if (items.length === 0) {
    return (
      <p className="text-center text-gray-500 py-6 text-sm">No hay registros en el acta</p>
    );
  }

  const totals = computeTotals(items, companySize, severity, actaSeverity);
  const utmTotal = totals['UTM'] || 0;
  const ufTotal = totals['UF'] || 0;

  function downloadActa() {
    const payload = {
      generado: new Date().toISOString(),
      tamaño_empresa: companySize,
      utm_value: utmValue,
      items: items.map(r => ({
        codigo: r.codigo,
        norma: r.norma,
        enunciado: r.enunciado,
        tipificacion: r.tipificacion,
        gravedad: actaSeverity[String(r.codigo)] || severity,
        multa: calcMulta(r, companySize, actaSeverity[String(r.codigo)] || severity),
      })),
      totales: totals,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'acta_multas.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function copyActa() {
    const lines = items.map(r => {
      const sev = actaSeverity[String(r.codigo)] || severity;
      const m = calcMulta(r, companySize, sev);
      return `[${r.codigo}] ${r.enunciado || ''}\n  Norma: ${r.norma || '—'}\n  Multa: ${m.value} ${m.unit} (${SEVERITY_LABELS[sev]})`;
    });
    const utmClp = utmTotal ? ` (${clpLabel(utmTotal, utmValue)})` : '';
    lines.push(`\nTOTAL UTM: ${utmTotal}${utmClp}`);
    navigator.clipboard.writeText(lines.join('\n\n')).catch(() => alert(lines.join('\n\n')));
  }

  const sevClasses: Record<Severity, string> = {
    leve: 'text-green-400',
    grave: 'text-yellow-400',
    gravisima: 'text-red-400',
  };

  return (
    <div className="p-3 space-y-2">
      {items.map(r => {
        const code = String(r.codigo);
        const sev = actaSeverity[code] || severity;
        const m = calcMulta(r, companySize, sev);
        const valLabel = `${m.value} ${m.unit}`;

        return (
          <div key={code} className="flex items-center gap-2 bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2">
            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0">
              {r.codigo}
            </span>
            <p className="text-xs text-gray-300 flex-1 truncate">{r.enunciado || r.tipificacion || ''}</p>
            <Select value={sev} onValueChange={v => onSetSeverity(code, v as Severity)}>
              <SelectTrigger className="h-7 w-28 text-xs border-[#374151] bg-[#1f2937]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="grave">Grave</SelectItem>
                <SelectItem value="gravisima">Gravísima</SelectItem>
              </SelectContent>
            </Select>
            <span className={`text-xs font-bold whitespace-nowrap ${sevClasses[sev]}`}>{valLabel}</span>
            <button
              onClick={() => onRemove(code)}
              className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg px-3 py-2.5 mt-1">
        <p className="text-[11px] font-semibold text-yellow-500 uppercase tracking-wide mb-1">Total estimado</p>
        {utmTotal > 0 && (
          <>
            <p className="text-lg font-extrabold text-yellow-300">
              {utmTotal.toLocaleString('es-CL')} UTM
            </p>
            {utmValue > 0 && (
              <p className="text-xs text-gray-400">{clpLabel(utmTotal, utmValue)}</p>
            )}
          </>
        )}
        {ufTotal > 0 && (
          <p className="text-lg font-extrabold text-yellow-300 mt-1">
            {ufTotal.toLocaleString('es-CL')} UF
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap pt-1">
        <Button size="sm" variant="outline" className="text-xs border-[#374151] hover:bg-[#1f2937]" onClick={downloadActa}>
          <Download className="w-3 h-3 mr-1" />Descargar
        </Button>
        <Button size="sm" variant="outline" className="text-xs border-[#374151] hover:bg-[#1f2937]" onClick={copyActa}>
          <Copy className="w-3 h-3 mr-1" />Copiar
        </Button>
        <Button size="sm" variant="destructive" className="text-xs" onClick={onClear}>
          <Trash2 className="w-3 h-3 mr-1" />Limpiar
        </Button>
      </div>
    </div>
  );
}
