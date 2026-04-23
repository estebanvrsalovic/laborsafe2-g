export type CompanySize = 'micro' | 'pequeña' | 'mediana' | 'grande';
export type Severity = 'leve' | 'grave' | 'gravisima';

export interface SeverityRow {
  leve: number;
  grave: number;
  gravisima: number;
}

export interface UtmObject {
  tipo?: string;
  micro?: SeverityRow;
  pequeña?: SeverityRow;
  pequena?: SeverityRow;
  mediana?: SeverityRow;
  grande?: SeverityRow;
  [key: string]: unknown;
}

export interface Registro {
  codigo: number | string;
  norma?: string;
  enunciado?: string;
  tipificacion?: string;
  naturaleza?: string | number;
  monto_multa?: string | number;
  utm?: string | UtmObject;
}

export interface MultaResult {
  unit: 'UTM' | 'UF';
  value: number | string;
}

type TableRow = Partial<Record<CompanySize, SeverityRow>>;

const DEFAULT_TABLES: Record<string, TableRow> = {
  estandar_nat2_base: {
    micro:   { leve: 3,   grave: 4,    gravisima: 5    },
    pequeña: { leve: 6,   grave: 8,    gravisima: 10   },
    mediana: { leve: 24,  grave: 32,   gravisima: 40   },
    grande:  { leve: 36,  grave: 48,   gravisima: 60   },
  },
  estandar_nat2_menor: {
    micro:   { leve: 3,   grave: 4,    gravisima: 5    },
    pequeña: { leve: 3,   grave: 4,    gravisima: 5    },
    mediana: { leve: 6,   grave: 8,    gravisima: 10   },
    grande:  { leve: 9,   grave: 12,   gravisima: 15   },
  },
  estandar_nat1_base: {
    micro:   { leve: 12,  grave: 16,   gravisima: 20   },
    pequeña: { leve: 30,  grave: 40,   gravisima: 50   },
    mediana: { leve: 96,  grave: 128,  gravisima: 160  },
    grande:  { leve: 180, grave: 240,  gravisima: 300  },
  },
  alta: {
    micro:   { leve: 30,  grave: 40,   gravisima: 50   },
    pequeña: { leve: 60,  grave: 80,   gravisima: 100  },
    mediana: { leve: 240, grave: 320,  gravisima: 400  },
    grande:  { leve: 540, grave: 720,  gravisima: 900  },
  },
  muy_alta: {
    micro:   { leve: 45,  grave: 60,   gravisima: 75   },
    pequeña: { leve: 90,  grave: 120,  gravisima: 150  },
    mediana: { leve: 360, grave: 480,  gravisima: 600  },
    grande:  { leve: 810, grave: 1080, gravisima: 1350 },
  },
  imm_rango_unico: {
    mediana: { leve: 16.04, grave: 21.38, gravisima: 26.73 },
  },
};

export function calcMulta(
  reg: Registro,
  companySize: CompanySize,
  severity: Severity
): MultaResult {
  const nat = String(reg.naturaleza ?? '').toLowerCase();

  if (nat.includes('no aplica') || nat.includes('uf') || reg.monto_multa) {
    return { unit: 'UF', value: reg.monto_multa || '(ver registro)' };
  }

  if (typeof reg.utm === 'string') {
    const table = DEFAULT_TABLES[reg.utm.toLowerCase()];
    if (table) {
      const row = table[companySize];
      if (row) return { unit: 'UTM', value: row[severity] };
    }
  }

  if (reg.utm && typeof reg.utm === 'object') {
    const utmObj = reg.utm as UtmObject;
    const row =
      (utmObj[companySize] as SeverityRow | undefined) ??
      (companySize === 'pequeña' ? (utmObj['pequena'] as SeverityRow | undefined) : undefined);
    if (row) {
      const val = row[severity] ?? row['gravisima'];
      return { unit: 'UTM', value: val };
    }
  }

  return { unit: 'UTM', value: 'N/D' };
}

export function computeTotals(
  items: Registro[],
  companySize: CompanySize,
  severity: Severity,
  severityPerCode: Record<string, Severity>
): Record<string, number> {
  const totals: Record<string, number> = {};
  items.forEach(r => {
    const code = String(r.codigo);
    const sev = severityPerCode[code] || severity;
    const m = calcMulta(r, companySize, sev);
    const unit = m.unit;
    let val: number | null = null;
    if (typeof m.value === 'number') val = m.value;
    else if (typeof m.value === 'string') {
      const match = m.value.match(/[\d]+([\.,][\d]+)?/);
      if (match) val = parseFloat(match[0].replace(',', '.'));
    }
    if (val == null || isNaN(val)) return;
    totals[unit] = (totals[unit] || 0) + val;
  });
  return totals;
}

export function clpLabel(utms: number, utmValue: number): string {
  if (!utmValue) return '';
  const clp = Math.round(utms * utmValue);
  return '≈ ' + clp.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  leve: 'Leve',
  grave: 'Grave',
  gravisima: 'Gravísima',
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  micro: 'Micro (1–9)',
  pequeña: 'Pequeña (10–49)',
  mediana: 'Mediana (50–199)',
  grande: 'Grande (200+)',
};
