// tariffRules.ts
// Utilidades para tarifas por pallet basadas en postcodes (England & Wales).
// - Expresa/Saturday usan precio de Next Day.
// - Soporta tokens: "OX14", "OX18-29", "OX39+", "CA".
// - Permite construir reglas desde valores de una Google Sheet.

// ===== Tipos públicos =====
export type ShippingMode = 'pickup' | 'delivery';
export type DeliverySpeed = 'economy' | 'express' | 'saturday';

export type Speed = DeliverySpeed;
export type PerPalletTariff = { economy: number | 'POA'; nextDay: number | 'POA' };

export type TariffRow = {
  zone: string;               // "WMA", "1", "7", etc.
  rawPostcodes: string;       // texto tal cual de la sheet (separado por comas)
  perPallet: PerPalletTariff; // usamos Full Pallet: economy / nextDay
};

export type Rule =
  | { kind: 'exact';  prefix: string; num: number }
  | { kind: 'range';  prefix: string; start: number; end: number }
  | { kind: 'open';   prefix: string; start: number }    // ej. OX39+ -> 39 o más
  | { kind: 'prefix'; prefix: string };                  // ej. "CA" (sin número)

export type RuleWithTariff = Rule & { perPallet: PerPalletTariff; zone: string };

export type BuiltRules = { rules: RuleWithTariff[] };

// ===== Constantes =====
export const FULL_PALLET_KG = 1000; // según la tarifa (1.2 x 1.2 x 2 m, máx 1000 kg)


// Reemplaza normalizeCode por esta versión
export function normalizeCode(input: string) {
    // mayúsculas, sin espacios ni guiones
    const t = input.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
  
    // Solo prefijo (CA, PR, W, WC…)
    const mPrefixOnly = /^([A-Z]{1,3})$/.exec(t);
    if (mPrefixOnly) return { prefix: mPrefixOnly[1], num: null };
  
    // Outcode UK: letras (1-3) + 1-2 dígitos, ignorando lo que siga
    const m = /^([A-Z]{1,3})(\d{1,2})/.exec(t);
    if (!m) return null;
    return { prefix: m[1], num: Number(m[2]) };
  }
  
// Convierte un token de la sheet a 1..n reglas (con su tarifa y zona)
export function parseTokenToRules(
  token: string,
  perPallet: PerPalletTariff,
  zone: string
): RuleWithTariff[] {
    const t = token
    .toUpperCase()
    .replace(/\u00A0/g, ' ')       // NBSP -> espacio
    .replace(/\s+/g, '')           // quita espacios
    .replace(/[.]/g, '');     
  if (!t) return [];

  // "CA", "PR", "W", "WC" (solo prefijo)
  if (/^[A-Z]{1,3}$/.test(t)) {
    return [{ kind: 'prefix', prefix: t, perPallet, zone }];
  }

  // "OX39+"
  let m = /^([A-Z]{1,3})(\d+)\+$/.exec(t);
  if (m) {
    return [{ kind: 'open', prefix: m[1], start: Number(m[2]), perPallet, zone }];
  }

  // "OX18-29", "NE50-64"
  m = /^([A-Z]{1,3})(\d+)-([0-9]+)$/.exec(t);
  if (m) {
    return [
      {
        kind: 'range',
        prefix: m[1],
        start: Number(m[2]),
        end: Number(m[3]),
        perPallet,
        zone
      }
    ];
  }

  // "OX14", "NE19"
  m = /^([A-Z]{1,3})(\d+)$/.exec(t);
  if (m) {
    return [
      {
        kind: 'exact',
        prefix: m[1],
        num: Number(m[2]),
        perPallet,
        zone
      }
    ];
  }

  // Si llega algo no parseable, lo ignoramos (p. ej. "ALL OTHER AREAS")
  return [];
}

// Devuelve el precio por pallet según la velocidad.
// IMPORTANTE: express y saturday usan Next Day.
export function priceForSpeed(perPallet: PerPalletTariff, speed: Speed): number | 'POA' {
  if (speed === 'economy') return perPallet.economy;
  return perPallet.nextDay; // express & saturday
}

// Busca la regla que cubre un postcode
export function findTariffFor(postcode: string, rules: RuleWithTariff[]): RuleWithTariff | null {
  const n = normalizeCode(postcode);
  if (!n) return null;

  // Prefiltro por prefijo
  const candidates = rules.filter(
    (r) =>
      r.prefix === n.prefix || (r.kind === 'prefix' && r.prefix === n.prefix)
  );

  for (const r of candidates) {
    if (r.kind === 'prefix') return r; // cualquier número
    if (n.num == null) continue;
    if (r.kind === 'exact' && n.num === r.num) return r;
    if (r.kind === 'range' && n.num >= r.start && n.num <= r.end) return r;
    if (r.kind === 'open' && n.num >= r.start) return r;
  }
  return null;
}

// Construye las reglas a partir de filas ya normalizadas (TariffRow[])
export function buildRulesFromRows(rows: TariffRow[]): BuiltRules {
  const rules: RuleWithTariff[] = [];
  for (const row of rows) {
    for (const token of row.rawPostcodes.split(',')) {
      rules.push(...parseTokenToRules(token, row.perPallet, row.zone));
    }
  }
  return { rules };
}

// Construye reglas directo desde los valores crudos de Google Sheets (values API).
// Espera encabezados: Zone | Postcode | Economy Half | Economy Full | Next Day Half | Next Day Full
export function buildRulesFromSheetValues(values: string[][]): BuiltRules {
  if (!values || values.length <= 1) return { rules: [] };

  const rows = values.slice(1); // sin header
  const toNumOrPOA = (v: string): number | 'POA' => {
    if (!v || /POA/i.test(v)) return 'POA';
    return Number(String(v).replace(/[£,\s]/g, '')); // "£54" -> 54
  };

  const tariffRows: TariffRow[] = [];
  for (const row of rows) {
    const zone = (row[0] ?? '').trim();
    const rawPostcodes = (row[1] ?? '').trim();
    const ecoFull = (row[3] ?? '').trim();
    const ndFull = (row[5] ?? '').trim();

    if (!rawPostcodes || /ALL OTHER AREAS|IRELAND|REST OF EUROPE/i.test(rawPostcodes)) {
      continue; // omitir filas sin cobertura concreta
    }

    const perPallet: PerPalletTariff = {
      economy: toNumOrPOA(ecoFull),
      nextDay: toNumOrPOA(ndFull),
    };

    tariffRows.push({ zone, rawPostcodes, perPallet });
  }

  return buildRulesFromRows(tariffRows);
}

// Cálculo del coste de envío (por pallet) con fallback opcional.
// - Mantiene envío gratis si totalKg > freeOverKg (por defecto 300).
// - Si no hay postcode o reglas, puede usar fallback fijo.
export function calcDeliveryFeeByTariff(options: {
  totalKg: number;
  mode: ShippingMode;
  speed: DeliverySpeed;
  postcode?: string;
  rules?: RuleWithTariff[];
  freeOverKg?: number;       // default 300 (tu política actual)
  fallback?: (speed: DeliverySpeed) => number; // ej. economy=75, express=95, saturday=100
}): number {
  const {
    totalKg,
    mode,
    speed,
    postcode,
    rules = [],
    freeOverKg = 300,
    fallback,
  } = options;

  // Pick up
  if (mode === 'pickup') return 0;

  // Envío gratis por kg total (opcional)
  if (freeOverKg > 0 && totalKg > freeOverKg) return 0;

  // Sin postcode o sin reglas: usar fallback si existe
  if (!postcode || rules.length === 0) {
    return fallback ? fallback(speed) : 0;
  }

  const match = findTariffFor(postcode, rules);
  if (!match) {
    // Fuera de cobertura: decide política. Aquí devolvemos 0 (o podrías devolver un valor alto).
    return 0;
  }

  const unit = priceForSpeed(match.perPallet, speed);
  if (unit === 'POA') {
    // Precio bajo solicitud: 0 y manejar en UI un "POA" / “we’ll contact you”.
    return 0;
  }

  const pallets = Math.ceil(totalKg / FULL_PALLET_KG);
  return pallets * unit;
}

// Devuelve detalle útil para UI (zona, unit, pallets, fee)
export function getTariffInfo(options: {
  totalKg: number;
  speed: DeliverySpeed;
  postcode: string;
  rules: RuleWithTariff[];
}) {
  const { totalKg, speed, postcode, rules } = options;
  const m = findTariffFor(postcode, rules);
  if (!m) return { status: 'no_match' as const };

  const unit = priceForSpeed(m.perPallet, speed);
  if (unit === 'POA') return { status: 'poa' as const, zone: m.zone };

  const pallets = Math.ceil(totalKg / FULL_PALLET_KG);
  return { status: 'ok' as const, zone: m.zone, unit, pallets, fee: pallets * unit };
}
