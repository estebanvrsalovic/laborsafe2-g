'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, Loader2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import ModuleLayout from '@/components/ModuleLayout';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/routes';

const CSV_URL = '/matriz_legal.csv';

const TIPO_COLORS: Record<string, string> = {
  ISO:                  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DFL:                  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  DECRETO:              'bg-orange-500/15 text-orange-400 border-orange-500/30',
  LEY:                  'bg-green-500/15 text-green-400 border-green-500/30',
  NCH:                  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'RESOLUCIÓN EXENTA':  'bg-red-500/15 text-red-400 border-red-500/30',
  SUSESO:               'bg-teal-500/15 text-teal-400 border-teal-500/30',
  PROTOCOLO:            'bg-pink-500/15 text-pink-400 border-pink-500/30',
  INSTRUCTIVO:          'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const DEFAULT_COLOR = 'bg-gray-500/15 text-gray-400 border-gray-500/30';

interface LegalEntry {
  TIPO: string;
  NOMBRE: string;
  DESCRIPCIÓN: string;
  LINK: string;
}

interface ProtocolGroup {
  nombre: string;
  docs: { descripcion: string; link: string }[];
}

function parseCSV(text: string): LegalEntry[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const rows: LegalEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
      current += char;
    }
    fields.push(current.trim());
    if (fields.length >= 4 && fields[0]) {
      rows.push({ TIPO: fields[0], NOMBRE: fields[1] ?? '', DESCRIPCIÓN: fields[2] ?? '', LINK: fields[3] ?? '' });
    }
  }
  return rows;
}

export default function MatrizLegalPage() {
  const [data, setData] = useState<LegalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTipo, setActiveTipo] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(CSV_URL)
      .then(r => r.text())
      .then(text => { setData(parseCSV(text)); setLoading(false); })
      .catch(() => { setError('No se pudo cargar la matriz legal.'); setLoading(false); });
  }, []);

  const tipos = useMemo(() => [...new Set(data.map(d => d.TIPO))].sort(), [data]);

  // Separate protocols from regular entries
  const { normalEntries, protocolGroups } = useMemo(() => {
    const normal = data.filter(d => d.TIPO !== 'PROTOCOLO');
    const groupMap = new Map<string, { descripcion: string; link: string }[]>();
    data.filter(d => d.TIPO === 'PROTOCOLO').forEach(d => {
      if (!groupMap.has(d.NOMBRE)) groupMap.set(d.NOMBRE, []);
      groupMap.get(d.NOMBRE)!.push({ descripcion: d.DESCRIPCIÓN, link: d.LINK });
    });
    const groups: ProtocolGroup[] = Array.from(groupMap.entries()).map(([nombre, docs]) => ({ nombre, docs }));
    return { normalEntries: normal, protocolGroups: groups };
  }, [data]);

  const q = search.toLowerCase();

  const filteredNormal = useMemo(() => {
    return normalEntries.filter(e => {
      const matchesTipo = !activeTipo || e.TIPO === activeTipo;
      const matchesSearch = !q || e.NOMBRE.toLowerCase().includes(q) || e.DESCRIPCIÓN.toLowerCase().includes(q);
      return matchesTipo && matchesSearch;
    });
  }, [normalEntries, activeTipo, q]);

  const filteredProtocols = useMemo(() => {
    if (activeTipo && activeTipo !== 'PROTOCOLO') return [];
    return protocolGroups.filter(pg => {
      if (!q) return true;
      return pg.nombre.toLowerCase().includes(q) || pg.docs.some(d => d.descripcion.toLowerCase().includes(q));
    });
  }, [protocolGroups, activeTipo, q]);

  const totalResults = filteredNormal.length + filteredProtocols.length;

  const toggleExpand = (nombre: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(nombre) ? next.delete(nombre) : next.add(nombre);
      return next;
    });
  };

  return (
    <ModuleLayout
      title="Matriz Legal"
      description="Legislación laboral y normativa actualizada"
      backHref={ROUTES.DASHBOARD}
    >
      {loading && (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando matriz legal...
        </div>
      )}

      {error && <div className="text-center py-24 text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-[#111827] border-[#1f2937] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTipo(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  !activeTipo ? 'bg-white text-black border-white' : 'border-[#1f2937] text-gray-400 hover:border-gray-500'
                }`}
              >
                Todos ({normalEntries.length + protocolGroups.length})
              </button>
              {tipos.map(tipo => {
                const count = tipo === 'PROTOCOLO'
                  ? protocolGroups.length
                  : normalEntries.filter(e => e.TIPO === tipo).length;
                return (
                  <button
                    key={tipo}
                    onClick={() => setActiveTipo(activeTipo === tipo ? null : tipo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      activeTipo === tipo ? (TIPO_COLORS[tipo] ?? DEFAULT_COLOR) : 'border-[#1f2937] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {tipo} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-3">{totalResults} resultado{totalResults !== 1 ? 's' : ''}</p>

          {/* Table */}
          <div className="rounded-xl border border-[#1f2937] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937] bg-[#111827]">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-36">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-56">Nombre</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Descripción</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-16">Link</th>
                </tr>
              </thead>
              <tbody>
                {/* Regular entries */}
                {filteredNormal.map((entry, i) => (
                  <tr key={`n-${i}`} className="border-b border-[#1f2937] last:border-0 hover:bg-[#111827]/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TIPO_COLORS[entry.TIPO] ?? DEFAULT_COLOR}`}>
                        {entry.TIPO}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{entry.NOMBRE}</td>
                    <td className="px-4 py-3 text-gray-300 leading-snug">{entry.DESCRIPCIÓN}</td>
                    <td className="px-4 py-3">
                      {entry.LINK ? (
                        <a href={entry.LINK} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                ))}

                {/* Protocol groups */}
                {filteredProtocols.map(pg => {
                  const isOpen = expanded.has(pg.nombre);
                  const visibleDocs = q
                    ? pg.docs.filter(d => d.descripcion.toLowerCase().includes(q) || pg.nombre.toLowerCase().includes(q))
                    : pg.docs;
                  return (
                    <>
                      <tr
                        key={`p-${pg.nombre}`}
                        onClick={() => toggleExpand(pg.nombre)}
                        className="border-b border-[#1f2937] hover:bg-[#111827]/60 transition-colors cursor-pointer select-none"
                      >
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TIPO_COLORS['PROTOCOLO']}`}>
                            PROTOCOLO
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{pg.nombre}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {pg.docs.length} documento{pg.docs.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                      </tr>
                      {isOpen && visibleDocs.map((doc, j) => (
                        <tr key={`p-${pg.nombre}-${j}`} className="border-b border-[#1f2937] bg-[#0d1117]">
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5 text-gray-400 text-xs leading-snug pl-6 border-l border-pink-500/20">
                            {doc.descripcion}
                          </td>
                          <td className="px-4 py-2.5">
                            {doc.link ? (
                              <a href={doc.link} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>

            {totalResults === 0 && (
              <div className="text-center py-12 text-gray-500">
                No se encontraron resultados para tu búsqueda.
              </div>
            )}
          </div>
        </>
      )}
    </ModuleLayout>
  );
}
