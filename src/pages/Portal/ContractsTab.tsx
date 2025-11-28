// src/pages/account/ContractsTab.tsx
import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext"; // ajusta la ruta a tu AuthContext

// ─────────────────────────────
// Helpers
// ─────────────────────────────
const fmtGBP = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n) ? `£${n.toFixed(2)}` : "—";

const fmtNum = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString() : "—";

const parseMaybeNumber = (v: any): number | undefined => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const f = parseFloat(v);
    return Number.isFinite(f) ? f : undefined;
  }
  return undefined;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ─────────────────────────────
// Tipos (copiados del admin)
// ─────────────────────────────
interface DispatchHistoryLine {
  variety?: string;
  bags?: number;
  kg?: number;
  remainingBags?: number;
  remainingKg?: number;
}

interface DispatchHistoryEntry {
  createdAt?:
    | { seconds?: number; nanoseconds?: number }
    | { _seconds?: number; _nanoseconds?: number }
    | null;
  lines?: DispatchHistoryLine[];
}

export interface Contract {
  id: string;
  contractNo?: string | null;
  name: string;
  email: string;
  s3Url: string;
  fileKey: string;
  status:
    | "pending"
    | "active"
    | "processing"
    | "completed"
    | "cancelled"
    | string;
  createdAt:
    | { seconds: number; nanoseconds: number }
    | { _seconds: number; _nanoseconds: number }
    | null;

  // datos extendidos (igual que admin)
  details?: Record<string, any> | null;
  replacementsSnapshot?: Record<string, any> | null;
  reservation?: {
    startMonth?: string;
    endMonth?: string;
    frequency?: string;
    months?: string | number;
    month1?: string;
    month2?: string;
    year1?: string;
    year2?: string;
  } | null;
  selections?: Array<{
    variety?: string;
    bags?: number;
    lineKg?: number;
    unitPricePerKg?: number;
    lineSubtotal?: number;
    remainingBags?: number;
    remainingKg?: number;
  }> | null;
  totals?: {
    pricePerBagKg?: number;
    totalAmountGBP?: number;
    totalKg?: number;
  } | null;
  dispatchHistory?: DispatchHistoryEntry[] | null;
}

type View = "list" | "detail";

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-300",
  active: "bg-blue-100 text-blue-700 border-blue-300",
  processing: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "—";
  try {
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (!seconds) return "—";
    const date = new Date(seconds * 1000);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// ─────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────
const ContractsTab: React.FC = () => {
  const { currentUser } = useAuth();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "active" | "completed" | "cancelled" | "processing"
  >("");
  const [activeView, setActiveView] = useState<View>("list");
  const [selected, setSelected] = useState<Contract | null>(null);
  const [unitView, setUnitView] = useState<"bags" | "kg">("bags");

  // ── FETCH: igual al admin, pero filtrando por email del usuario ──
  useEffect(() => {
    if (!currentUser) return;

    const fetchContracts = async () => {
      setLoading(true);
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(
          `${import.meta.env.VITE_FULL_ENDPOINT}/api/getContracts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch contracts");
        const data: Contract[] = await res.json();

        const myEmail = currentUser.email?.toLowerCase();
        const filteredByEmail = myEmail
          ? data.filter(
              (c) => c.email && c.email.toLowerCase() === myEmail
            )
          : data;

        setContracts(filteredByEmail);
      } catch (err) {
        console.error("Error fetching user contracts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [currentUser]);

  const filtered = useMemo(
    () =>
      contracts.filter((c) =>
        statusFilter ? c.status === statusFilter : true
      ),
    [contracts, statusFilter]
  );

  // ─────────────────────────────
  // VISTA DETALLE (solo lectura)
  // ─────────────────────────────
  if (activeView === "detail" && selected) {
    const c = selected;
    const label = c.contractNo || c.id;

    const details = c.details || null;
    const totals = details?.totals || c.totals || null;
    const reservation = details?.reservation || c.reservation || null;
    const selections: any[] =
      (Array.isArray(details?.selections)
        ? details.selections
        : c.selections) || [];
    const repl =
      details?.replacementsSnapshot || c.replacementsSnapshot || null;
    const dispatchHistory: DispatchHistoryEntry[] =
      (c.dispatchHistory as DispatchHistoryEntry[]) ||
      (details?.dispatchHistory as DispatchHistoryEntry[]) ||
      [];

    const totalKg =
      parseMaybeNumber(totals?.totalKg) ??
      (selections.length
        ? selections.reduce(
            (acc, it) => acc + (parseMaybeNumber(it.lineKg) ?? 0),
            0
          )
        : undefined);

    const totalAmount =
      parseMaybeNumber(totals?.totalAmountGBP) ??
      (selections.length
        ? selections.reduce(
            (acc, it) => acc + (parseMaybeNumber(it.lineSubtotal) ?? 0),
            0
          )
        : undefined);

    const pricePerBagKg =
      parseMaybeNumber(totals?.pricePerBagKg) ??
      (selections.length &&
      selections.every(
        (it: any) => parseMaybeNumber(it.lineKg) && parseMaybeNumber(it.bags)
      )
        ? (() => {
            const nums = selections
              .map((it: any) => {
                const kg = parseMaybeNumber(it.lineKg)!;
                const bags = parseMaybeNumber(it.bags)!;
                return bags > 0 ? kg / bags : undefined;
              })
              .filter(Boolean) as number[];
            return nums.length ? nums[0] : undefined;
          })()
        : undefined);

    const hasDetailsBlock = Boolean(
      totals ||
        totalKg ||
        totalAmount ||
        reservation ||
        (selections?.length ?? 0) > 0 ||
        repl ||
        (dispatchHistory?.length ?? 0) > 0
    );

    return (
      <div className="bg-white border rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSelected(null);
              setActiveView("list");
            }}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Back to contracts
          </button>

          <div className="flex items-center gap-3">
            {c.s3Url && (
              <a
                href={c.s3Url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm inline-flex items-center gap-2"
                title="Download"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download
              </a>
            )}
            <span
              className={`px-2 py-0.5 rounded-full border text-xs uppercase tracking-wide ${
                statusColors[c.status] ||
                "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {c.status}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Contract #{label}</h2>
        </div>

        {/* Meta básica */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">
              Customer
            </p>
            <p className="text-base font-medium">{c.name || "(No name)"}</p>
            {c.email && (
              <a
                className="text-sm text-blue-600 underline"
                href={`mailto:${c.email}`}
              >
                {c.email}
              </a>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">
              Meta
            </p>
            <p className="text-sm text-gray-700">
              Created: {formatDate(c.createdAt)}
            </p>
            <p className="text-sm text-gray-700 break-all">
              File key: <span className="font-mono">{c.fileKey || "—"}</span>
            </p>
            <p className="text-sm text-gray-700">Number: {label}</p>
          </div>
        </div>

        {/* Detalles extendidos */}
        {hasDetailsBlock && (
          <div className="space-y-6">
            {/* Order summary */}
            {(totals || totalKg || totalAmount) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Order summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-gray-600">
                      Total KG
                    </p>
                    <p className="text-base font-medium">
                      {fmtNum(totalKg)}
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-gray-600">
                      Total amount (GBP)
                    </p>
                    <p className="text-base font-medium">
                      {fmtGBP(totalAmount)}
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-gray-600">
                      KG per bag
                    </p>
                    <p className="text-base font-medium">
                      {fmtNum(pricePerBagKg)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule */}
            {reservation &&
              (reservation.startMonth ||
                reservation.endMonth ||
                reservation.frequency) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        Start month
                      </p>
                      <p className="text-base font-medium">
                        {reservation.startMonth || "—"}
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        End month
                      </p>
                      <p className="text-base font-medium">
                        {reservation.endMonth || "—"}
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        Frequency
                      </p>
                      <p className="text-base font-medium">
                        {reservation.frequency || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        Months
                      </p>
                      <p className="text-base font-medium">
                        {reservation.months ?? repl?.MONTHS ?? "—"}
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        Period
                      </p>
                      <p className="text-base font-medium">
                        {(reservation.year1 || repl?.YEAR1 || "—")} –{" "}
                        {(reservation.year2 || repl?.YEAR2 || "—")}
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        First/Last month
                      </p>
                      <p className="text-base font-medium">
                        {(reservation.month1 || repl?.MONTH1 || "—")} /{" "}
                        {(reservation.month2 || repl?.MONTH2 || "—")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Line items */}
            {selections.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Line items</h3>
                <div className="overflow-x-auto border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-semibold">Variety</th>
                        <th className="px-3 py-2 font-semibold">Bags</th>
                        <th className="px-3 py-2 font-semibold">KG</th>
                        <th className="px-3 py-2 font-semibold">£/KG</th>
                        <th className="px-3 py-2 font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selections.map((it: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">
                            {it.variety || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {fmtNum(parseMaybeNumber(it.bags))}
                          </td>
                          <td className="px-3 py-2">
                            {fmtNum(parseMaybeNumber(it.lineKg))}
                          </td>
                          <td className="px-3 py-2">
                            {fmtGBP(parseMaybeNumber(it.unitPricePerKg))}
                          </td>
                          <td className="px-3 py-2">
                            {fmtGBP(parseMaybeNumber(it.lineSubtotal))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dispatch tracking (solo visual) */}
            {selections.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">
                    Dispatch tracking
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-600">
                      View as
                    </span>
                    <div className="border rounded overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setUnitView("bags")}
                        className={`px-3 py-1 text-sm ${
                          unitView === "bags"
                            ? "bg-[#044421] text-white"
                            : "bg-white text-[#044421]"
                        }`}
                      >
                        Bags
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitView("kg")}
                        className={`px-3 py-1 text-sm border-l ${
                          unitView === "kg"
                            ? "bg-[#044421] text-white"
                            : "bg-white text-[#044421]"
                        }`}
                      >
                        KG
                      </button>
                    </div>
                  </div>
                </div>

                {/* Totales rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-gray-600">
                      Total bags (all varieties)
                    </p>
                    <p className="text-base font-medium">
                      {fmtNum(
                        selections.reduce(
                          (acc: number, it: any) =>
                            acc + (parseMaybeNumber(it.bags) ?? 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-gray-600">
                      Total KG (all varieties)
                    </p>
                    <p className="text-base font-medium">
                      {fmtNum(
                        selections.reduce((acc: number, it: any) => {
                          const kg = parseMaybeNumber(it.lineKg);
                          const bags = parseMaybeNumber(it.bags);
                          return acc + (kg ?? ((bags ?? 0) * 24));
                        }, 0)
                      )}
                    </p>
                  </div>
                  {totals?.totalAmountGBP != null && (
                    <div className="border rounded p-3">
                      <p className="text-xs uppercase text-gray-600">
                        Total amount (GBP)
                      </p>
                      <p className="text-base font-medium">
                        £{Number(totals.totalAmountGBP).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tabla por variedad (remaining) */}
                <div className="overflow-x-auto border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-semibold">
                          Variety
                        </th>
                        <th className="px-3 py-2 font-semibold">
                          {unitView === "bags"
                            ? "Total bags"
                            : "Total KG"}
                        </th>
                        <th className="px-3 py-2 font-semibold">
                          {unitView === "bags"
                            ? "Remaining bags"
                            : "Remaining KG"}
                        </th>
                        <th className="px-3 py-2 font-semibold">
                          Remaining %
                        </th>
                        <th className="px-3 py-2 font-semibold w-64">
                          Progress (remaining)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selections.map((it: any, idx: number) => {
                        const totalBags = parseMaybeNumber(it.bags) ?? 0;
                        const totalKg =
                          parseMaybeNumber(it.lineKg) ?? totalBags * 24;

                        const remBags =
                          parseMaybeNumber(it.remainingBags) ?? totalBags;
                        const remKg =
                          parseMaybeNumber(it.remainingKg) ?? totalKg;

                        const total =
                          unitView === "bags" ? totalBags : totalKg;
                        const remaining =
                          unitView === "bags" ? remBags : remKg;

                        const pctRemaining =
                          total > 0 ? clamp01(remaining / total) : 0;
                        const pctRemainingLabel = Math.round(
                          pctRemaining * 100
                        );

                        return (
                          <tr
                            key={idx}
                            className="border-t align-middle"
                          >
                            <td className="px-3 py-3 font-medium">
                              {it.variety || "(Variety)"}
                            </td>
                            <td className="px-3 py-3">
                              {fmtNum(total)}
                            </td>
                            <td className="px-3 py-3">
                              {fmtNum(remaining)}
                            </td>
                            <td className="px-3 py-3">
                              {pctRemainingLabel}%
                            </td>
                            <td className="px-3 py-3">
                              <div className="w-full bg-gray-200 rounded h-2.5">
                                <div
                                  className="h-2.5 rounded"
                                  style={{
                                    width: `${pctRemaining * 100}%`,
                                    backgroundColor: "#16a34a",
                                    transition: "width 300ms ease",
                                  }}
                                  aria-label={`Remaining ${pctRemainingLabel}%`}
                                />
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {unitView === "bags"
                                  ? `Completed: ${fmtNum(
                                      total - remaining
                                    )} / ${fmtNum(total)} bags`
                                  : `Completed: ${fmtNum(
                                      total - remaining
                                    )} / ${fmtNum(total)} kg`}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-gray-500 mt-2">
                  The green bar shows how much is <b>remaining</b> to be
                  dispatched per variety.
                </p>
              </div>
            )}

            {/* Dispatch history (solo lectura) */}
            {dispatchHistory && dispatchHistory.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">
                  Dispatch history
                </h3>
                <p className="text-[11px] text-gray-500 mb-3">
                  List of all dispatches applied to this contract (newest
                  first).
                </p>

                <div className="space-y-4">
                  {dispatchHistory
                    .slice()
                    .sort((a, b) => {
                      const sa =
                        (a.createdAt as any)?.seconds ??
                        (a.createdAt as any)?._seconds ??
                        0;
                      const sb =
                        (b.createdAt as any)?.seconds ??
                        (b.createdAt as any)?._seconds ??
                        0;
                      return sb - sa;
                    })
                    .map((entry, idx) => (
                      <div
                        key={idx}
                        className="border rounded p-3 bg-gray-50/50"
                      >
                        <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
                          <span className="font-semibold">
                            Dispatch #{dispatchHistory.length - idx}
                          </span>
                          <span>
                            {entry.createdAt
                              ? formatDate(entry.createdAt)
                              : "—"}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-white">
                              <tr className="text-left">
                                <th className="px-2 py-1 font-semibold">
                                  Variety
                                </th>
                                <th className="px-2 py-1 font-semibold">
                                  Bags
                                </th>
                                <th className="px-2 py-1 font-semibold">
                                  KG
                                </th>
                                <th className="px-2 py-1 font-semibold">
                                  Remaining bags
                                </th>
                                <th className="px-2 py-1 font-semibold">
                                  Remaining KG
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(entry.lines || []).map(
                                (line: any, j: number) => (
                                  <tr
                                    key={j}
                                    className="border-t bg-white"
                                  >
                                    <td className="px-2 py-1">
                                      {line.variety || "—"}
                                    </td>
                                    <td className="px-2 py-1">
                                      {fmtNum(line.bags)}
                                    </td>
                                    <td className="px-2 py-1">
                                      {fmtNum(line.kg)}
                                    </td>
                                    <td className="px-2 py-1">
                                      {fmtNum(line.remainingBags)}
                                    </td>
                                    <td className="px-2 py-1">
                                      {fmtNum(line.remainingKg)}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────
  // VISTA LISTA
  // ─────────────────────────────
  return (
    <>
      {/* Filtro por estado */}
      <div className="flex justify-end mb-4">
        <select
          className="border rounded px-3 py-2 text-sm md:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border rounded-lg">
        {loading ? (
          <div className="p-6 text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-600">
            No contracts found for your account.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => {
              const label = c.contractNo || c.id;
              return (
                <li
                  key={c.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelected(c);
                    setActiveView("detail");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelected(c);
                      setActiveView("detail");
                    }
                  }}
                >
                  {/* Left */}
                  <div>
                    <div className="font-semibold text-gray-800">
                      Contract #{label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {c.name || "(No name)"} — {c.email || ""}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(c.createdAt)}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    {c.s3Url && (
                      <a
                        href={c.s3Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FontAwesomeIcon
                          icon={faDownload}
                          className="text-white"
                        />
                        Download
                      </a>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full border text-sm capitalize ${
                        statusColors[c.status] ||
                        "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default ContractsTab;
