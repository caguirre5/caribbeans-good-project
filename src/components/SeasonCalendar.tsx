import { useMemo, useState } from "react";

type SeasonPhase = "Harvest" | "Shipping" | "Arrival";

type Segment = {
  phase: SeasonPhase;
  from: number; // 0=Jan ... 11=Dec, supports decimals (6.5 = mid-July)
  to: number;   // exclusive
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * ✅ Requested:
 * - Harvest: Dec → Apr
 * - Shipping: Apr → Jul
 * - Arrival: May → Sep
 * Overlaps are expected => we render 3 separate rows (one per phase).
 */
const GUATEMALA_SEGMENTS_BY_PHASE: Record<SeasonPhase, Segment[]> = {
  Harvest: [
    { phase: "Harvest", from: 11, to: 12 }, // Dec -> end Dec
    { phase: "Harvest", from: 0, to: 4 },   // Jan -> end Apr
  ],
  Shipping: [
    { phase: "Shipping", from: 3, to: 7 },  // Apr -> end Jul (exclusive 7 means up to Jul)
  ],
  Arrival: [
    { phase: "Arrival", from: 4, to: 9 },   // May -> end Sep
  ],
};

const PHASE = {
  Harvest: { color: "#00a65a" },
  Shipping: { color: "#5be1e2" },
  Arrival: { color: "#ff513c" },
} as const;

function indexToPercent(idx: number) {
  return (idx / 12) * 100;
}

function fmtMonth(idx: number) {
  const base = Math.floor(idx);
  const m = MONTHS[base] ?? "";
  if (idx % 1 === 0.5) return `Mid ${m}`;
  return m;
}

function fmtRange(from: number, to: number) {
  return `${fmtMonth(from)} → ${fmtMonth(to)}`;
}

export default function GuatemalaSeasonCalendar() {
  const [hovered, setHovered] = useState<{
    phase: SeasonPhase;
    from: number;
    to: number;
  } | null>(null);

  const phases = useMemo(
    () => (["Harvest", "Shipping", "Arrival"] as SeasonPhase[]),
    []
  );

  return (
    <div className="rounded-[22px] border border-[#044421]/10 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#044421]/10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs tracking-widest uppercase text-[#044421]/60">
              Seasonal calendar
            </p>
            <h3
              className="text-xl md:text-2xl font-bold leading-tight text-[#044421]"
              style={{ fontFamily: "KingsThing" }}
            >
              Guatemala — Coffee Season
            </h3>
            <p className="text-xs text-[#044421]/60 mt-1">
              Harvest (Dec–Apr), Shipping (Apr–Jul), Arrival (May–Sep)
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2">
            {phases.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-[#044421]/10 bg-[#f6faf7]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PHASE[p].color }}
                />
                <span className="text-[#044421]/80 font-semibold">{p}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-5">
        {/* Months row */}
        <div className="grid grid-cols-12 text-[10px] text-[#044421]/55 font-semibold select-none">
          {MONTHS.map((m) => (
            <div key={m} className="text-center">
              {m}
            </div>
          ))}
        </div>

        {/* 3 rows (tracks) */}
        <div className="mt-4 space-y-3">
          {phases.map((phase) => {
            const segments = GUATEMALA_SEGMENTS_BY_PHASE[phase];

            return (
              <div key={phase} className="relative">
                {/* Background */}
                <div
                  className="h-7 rounded-[16px] border border-[#044421]/10 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(246,250,247,1) 0%, rgba(239,247,242,1) 100%)",
                  }}
                />

                {/* Segments */}
                {segments.map((seg, i) => {
                  const left = indexToPercent(seg.from);
                  const right = indexToPercent(seg.to);
                  const width = Math.max(0, right - left);

                  return (
                    <div
                      key={`${phase}-${i}`}
                      className="absolute top-0 h-7 rounded-[16px] transition-transform"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: PHASE[phase].color,
                        boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
                      }}
                      onMouseEnter={() =>
                        setHovered({ phase: seg.phase, from: seg.from, to: seg.to })
                      }
                      onMouseLeave={() => setHovered(null)}
                      title={`${seg.phase}: ${fmtRange(seg.from, seg.to)}`}
                    />
                  );
                })}

                {/* Month dividers */}
                <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                  {MONTHS.map((m) => (
                    <div key={m} className="border-r border-white/45 last:border-r-0" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>


        {/* Tooltip */}
        <div className="mt-4 min-h-[32px]">
          {hovered ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#044421]/10 bg-white shadow-sm">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PHASE[hovered.phase].color }}
              />
              <span className="text-xs font-semibold text-[#044421]">
                {hovered.phase}
              </span>
              <span className="text-xs text-[#044421]/60">
                {fmtRange(hovered.from, hovered.to)}
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-[#044421]/55">
              Hover a segment to see details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
