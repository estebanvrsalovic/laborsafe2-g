'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import ResultsList from '@/components/tipificador/ResultsList';
import DetailPanel from '@/components/tipificador/DetailPanel';
import ActaPanel from '@/components/tipificador/ActaPanel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES } from '@/lib/routes';
import {
  Registro, CompanySize, Severity,
  calcMulta, COMPANY_SIZE_LABELS, SEVERITY_LABELS,
} from '@/lib/tipificador-utils';
import { Loader2, Search, X, FileText } from 'lucide-react';

const DEFAULT_UTM = 69542;

export default function TipificadorPage() {
  const [allData, setAllData] = useState<Registro[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [companySize, setCompanySize] = useState<CompanySize>('pequeña');
  const [severity, setSeverity] = useState<Severity>('grave');
  const [utmInput, setUtmInput] = useState(String(DEFAULT_UTM));

  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
  const [acta, setActa] = useState<Record<string, Registro>>({});
  const [actaSeverity, setActaSeverity] = useState<Record<string, Severity>>({});

  useEffect(() => {
    fetch('/tipificador.json')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((json: unknown) => {
        const arr: Registro[] = Array.isArray(json) ? json : Object.values(json as Record<string, Registro>);
        setAllData(arr);
        restoreActa(arr);
      })
      .catch(err => setLoadError('No se pudo cargar el tipificador: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  function restoreActa(data: Registro[]) {
    try {
      const raw = localStorage.getItem('tipificador_acta');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { codes: string[]; severities: Record<string, Severity> };
      const codes = parsed.codes || [];
      const sevs = parsed.severities || {};
      const restoredActa: Record<string, Registro> = {};
      codes.forEach(c => {
        const reg = data.find(r => String(r.codigo) === c);
        if (reg) { restoredActa[c] = reg; }
      });
      setActa(restoredActa);
      setActaSeverity(sevs);
    } catch { /* ignore */ }
  }

  function persistActa(newActa: Record<string, Registro>, newSevs: Record<string, Severity>) {
    try {
      localStorage.setItem('tipificador_acta', JSON.stringify({
        codes: Object.keys(newActa),
        severities: newSevs,
      }));
    } catch { /* ignore */ }
  }

  const utmValue = useMemo(() => {
    const v = parseFloat(utmInput.replace(/[^0-9.]/g, ''));
    return isNaN(v) ? 0 : v;
  }, [utmInput]);

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return allData;
    return allData.filter(r => {
      const txt = [r.enunciado, r.tipificacion, r.norma, r.codigo].join(' ').toLowerCase();
      return tokens.every(t => txt.includes(t));
    });
  }, [allData, query]);

  const selectedRecord = useMemo(
    () => selectedCodigo ? (allData.find(r => String(r.codigo) === selectedCodigo) ?? null) : null,
    [allData, selectedCodigo]
  );

  const selectedMulta = useMemo(
    () => selectedRecord ? calcMulta(selectedRecord, companySize, severity) : null,
    [selectedRecord, companySize, severity]
  );

  const actaCodigos = useMemo(() => new Set(Object.keys(acta)), [acta]);

  const toggleActa = useCallback(() => {
    if (!selectedRecord) return;
    const code = String(selectedRecord.codigo);
    setActa(prev => {
      const next = { ...prev };
      if (next[code]) {
        delete next[code];
        setActaSeverity(s => {
          const ns = { ...s };
          delete ns[code];
          persistActa(next, ns);
          return ns;
        });
      } else {
        next[code] = selectedRecord;
        setActaSeverity(s => {
          const ns = { ...s, [code]: severity };
          persistActa(next, ns);
          return ns;
        });
      }
      return next;
    });
  }, [selectedRecord, severity]);

  const removeFromActa = useCallback((codigo: string) => {
    setActa(prev => {
      const next = { ...prev };
      delete next[codigo];
      setActaSeverity(s => {
        const ns = { ...s };
        delete ns[codigo];
        persistActa(next, ns);
        return ns;
      });
      return next;
    });
  }, []);

  const clearActa = useCallback(() => {
    setActa({});
    setActaSeverity({});
    persistActa({}, {});
  }, []);

  const setActaItemSeverity = useCallback((codigo: string, sev: Severity) => {
    setActaSeverity(prev => {
      const next = { ...prev, [codigo]: sev };
      persistActa(acta, next);
      return next;
    });
  }, [acta]);

  const actaCount = Object.keys(acta).length;

  return (
    <ModuleLayout
      title="Formulario Único de Fiscalización FUF"
      description="Calculadora de multas según Código del Trabajo"
      backHref={ROUTES.DASHBOARD}
    >
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            className="pl-8 bg-[#111827] border-[#374151] text-white placeholder:text-gray-500"
            placeholder="Buscar por descripción, norma, código..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Select value={companySize} onValueChange={v => setCompanySize(v as CompanySize)}>
          <SelectTrigger className="w-44 bg-[#111827] border-[#374151] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(COMPANY_SIZE_LABELS) as [CompanySize, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severity} onValueChange={v => setSeverity(v as Severity)}>
          <SelectTrigger className="w-36 bg-[#111827] border-[#374151] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">UTM (CLP)</span>
          <Input
            className="w-32 bg-[#111827] border-[#374151] text-white"
            value={utmInput}
            onChange={e => setUtmInput(e.target.value)}
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando tipificador...</span>
        </div>
      )}
      {loadError && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-4 text-red-400 text-sm">
          {loadError}
        </div>
      )}

      {/* Main layout */}
      {!loading && !loadError && (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">

          {/* Results list */}
          <div className="border border-[#1f2937] rounded-xl bg-[#0d1117] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1f2937] bg-[#111827] flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-200">Infracciones</span>
              <span className="text-xs text-gray-500">
                {query.trim() ? `${filtered.length} de ${allData.length}` : `${allData.length} registros`}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <ResultsList
                items={filtered}
                selectedCodigo={selectedCodigo}
                actaCodigos={actaCodigos}
                onSelect={setSelectedCodigo}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Detail */}
            <div className="border border-[#1f2937] rounded-xl bg-[#0d1117] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1f2937] bg-[#111827]">
                <span className="text-sm font-semibold text-gray-200">Detalle del registro</span>
              </div>
              <div className="overflow-y-auto max-h-[45vh]">
                <DetailPanel
                  record={selectedRecord}
                  multa={selectedMulta}
                  utmValue={utmValue}
                  severity={selectedCodigo ? (actaSeverity[selectedCodigo] || severity) : severity}
                  inActa={selectedCodigo ? actaCodigos.has(selectedCodigo) : false}
                  onToggleActa={toggleActa}
                />
              </div>
            </div>

            {/* Acta */}
            <div className="border border-[#1f2937] rounded-xl bg-[#0d1117] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1f2937] bg-[#111827] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-200">Acta de selección</span>
                </div>
                {actaCount > 0 && (
                  <span className="text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full">
                    {actaCount}
                  </span>
                )}
              </div>
              <ActaPanel
                acta={acta}
                actaSeverity={actaSeverity}
                companySize={companySize}
                severity={severity}
                utmValue={utmValue}
                onRemove={removeFromActa}
                onClear={clearActa}
                onSetSeverity={setActaItemSeverity}
              />
            </div>

          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
