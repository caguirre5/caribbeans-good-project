import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faCalendarDays,
  faCircleExclamation,
  faClock,
  faMagnifyingGlass,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useAuth } from "../../../../contexts/AuthContext";

type TimestampLike =
  | { seconds?: number; nanoseconds?: number; _seconds?: number; _nanoseconds?: number }
  | Date
  | string
  | number
  | null
  | undefined;

interface ContractSelection {
  variety?: string;
  bags?: number | string;
  bagKg?: number | string;
  lineKg?: number | string;
  remainingBags?: number | string;
  remainingKg?: number | string;
}

interface DispatchHistoryLine {
  variety?: string;
  bags?: number;
  kg?: number;
}

interface DispatchHistoryEntry {
  createdAt?: TimestampLike;
  lines?: DispatchHistoryLine[];
}

interface ContractControlRecord {
  id: string;
  contractNo?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  createdAt?: TimestampLike;
  details?: Record<string, any> | null;
  reservation?: Record<string, any> | null;
  selections?: ContractSelection[] | null;
  dispatchHistory?: DispatchHistoryEntry[] | null;
}

interface OrderItem {
  bags?: number;
  bagKg?: number;
  lineKg?: number;
  sourceType?: string;
  contractId?: string;
  contractNo?: string;
}

interface OrderRecord {
  id: string;
  status: string;
  createdAt: Date | null;
  preferredDeliveryDate?: Date | null;
  items: OrderItem[];
}

interface MonthActual {
  fulfilledKg: number;
  fulfilledBags: number;
  openKg: number;
  openBags: number;
}

interface MonthCell {
  key: string;
  label: string;
  expectedKg: number;
  expectedBags: number;
  actualKg: number;
  actualBags: number;
  openKg: number;
  openBags: number;
  cumulativeExpectedKg: number;
  cumulativeActualKg: number;
  balanceKg: number;
  state: "future" | "due" | "missed" | "partial" | "complete" | "ahead" | "covered";
}

interface ContractTotals {
  totalBags: number;
  totalKg: number;
  remainingBags: number;
  remainingKg: number;
}

interface MonthlyTarget {
  expectedBags: number;
  expectedKg: number;
}

interface ContractControlRow {
  contract: ContractControlRecord;
  customer: string;
  contractNo: string;
  periodLabel: string;
  startMonth: string;
  endMonth: string;
  monthKeys: string[];
  totalKg: number;
  totalBags: number;
  remainingKg: number;
  remainingBags: number;
  fulfilledKg: number;
  fulfilledBags: number;
  completionPct: number;
  originalPaceKg: number;
  originalPaceBags: number;
  recommendedPaceKg: number;
  recommendedPaceBags: number;
  suggestedNextBags: number;
  expectedToDateKg: number;
  balanceKg: number;
  monthsLeft: number;
  knownMonthlyKg: number;
  unallocatedKg: number;
  openOrderKg: number;
  status: "on_track" | "ahead" | "behind" | "due" | "needs_extension";
  cells: MonthCell[];
}

const monthNameToNumber: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const parseMaybeNumber = (value: any, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toDate = (value: TimestampLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const seconds = value.seconds ?? value._seconds;
  if (typeof seconds === "number") return new Date(seconds * 1000);
  return null;
};

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const dateToMonthKey = (date: Date | null) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "";

const monthKeyFromParts = (month?: any, year?: any) => {
  const yearNum = parseMaybeNumber(year, 0);
  const monthKey = String(month ?? "").trim().toLowerCase();
  const monthNum = monthNameToNumber[monthKey] || parseMaybeNumber(month, 0);
  if (!yearNum || !monthNum) return "";
  return `${yearNum}-${String(monthNum).padStart(2, "0")}`;
};

const addMonths = (key: string, amount: number) => {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const monthDiffInclusive = (start: string, end: string) => {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  return Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
};

const monthKeysBetween = (start: string, end: string) => {
  const count = monthDiffInclusive(start, end);
  return Array.from({ length: Math.min(count, 36) }, (_, index) => addMonths(start, index));
};

const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
  });
};

const getSelections = (contract: ContractControlRecord): ContractSelection[] => {
  const nested = contract.details?.selections;
  if (Array.isArray(nested)) return nested;
  if (Array.isArray(contract.selections)) return contract.selections;
  return [];
};

const getReservation = (contract: ContractControlRecord) =>
  contract.details?.reservation || contract.reservation || {};

const getDispatchHistory = (contract: ContractControlRecord): DispatchHistoryEntry[] => {
  const nested = contract.details?.dispatchHistory;
  if (Array.isArray(contract.dispatchHistory)) return contract.dispatchHistory;
  if (Array.isArray(nested)) return nested;
  return [];
};

const getSelectionBagKg = (selection: ContractSelection) => {
  const bags = parseMaybeNumber(selection.bags);
  const lineKg = parseMaybeNumber(selection.lineKg);
  return parseMaybeNumber(selection.bagKg, bags > 0 && lineKg > 0 ? lineKg / bags : 24);
};

const contractTotals = (contract: ContractControlRecord): ContractTotals => {
  const selections = getSelections(contract);
  return selections.reduce<ContractTotals>(
    (acc, selection) => {
      const bags = parseMaybeNumber(selection.bags);
      const bagKg = getSelectionBagKg(selection);
      const lineKg = parseMaybeNumber(selection.lineKg, bags * bagKg);
      const remainingBags = parseMaybeNumber(selection.remainingBags, bags);
      const remainingKg = parseMaybeNumber(selection.remainingKg, remainingBags * bagKg);
      return {
        totalBags: acc.totalBags + bags,
        totalKg: acc.totalKg + lineKg,
        remainingBags: acc.remainingBags + remainingBags,
        remainingKg: acc.remainingKg + remainingKg,
      };
    },
    { totalBags: 0, totalKg: 0, remainingBags: 0, remainingKg: 0 }
  );
};

const buildMonthlyTargets = (contract: ContractControlRecord, totalMonths: number): MonthlyTarget[] => {
  const targets = Array.from({ length: totalMonths }, () => ({ expectedBags: 0, expectedKg: 0 }));

  getSelections(contract).forEach((selection) => {
    const totalBags = Math.max(0, Math.round(parseMaybeNumber(selection.bags)));
    if (!totalBags) return;

    const bagKg = getSelectionBagKg(selection);
    const baseBags = Math.floor(totalBags / totalMonths);
    const remainderBags = totalBags % totalMonths;

    targets.forEach((target, index) => {
      const bagsForMonth = baseBags + (index === totalMonths - 1 ? remainderBags : 0);
      target.expectedBags += bagsForMonth;
      target.expectedKg += bagsForMonth * bagKg;
    });
  });

  return targets;
};

const inferPeriod = (contract: ContractControlRecord) => {
  const reservation = getReservation(contract);
  const createdMonth = dateToMonthKey(toDate(contract.createdAt)) || currentMonthKey();
  const startMonth =
    String(reservation.startMonth || "").trim() ||
    monthKeyFromParts(reservation.month1, reservation.year1) ||
    createdMonth;
  const months = Math.max(1, Math.round(parseMaybeNumber(reservation.months, 1)));
  const endMonth =
    String(reservation.currentEndMonth || reservation.endMonth || "").trim() ||
    monthKeyFromParts(reservation.month2, reservation.year2) ||
    addMonths(startMonth, months - 1);
  return { startMonth, endMonth };
};

const isOpenOrderStatus = (status: string) => {
  const normalized = status.toLowerCase().trim();
  return normalized === "pending" || normalized === "processing";
};

const isFulfilledOrderStatus = (status: string) => {
  const normalized = status.toLowerCase().trim();
  return normalized === "handoff" || normalized === "completed";
};

const kgForOrderItem = (item: OrderItem) =>
  parseMaybeNumber(item.lineKg, parseMaybeNumber(item.bags) * parseMaybeNumber(item.bagKg, 24));

const getMonthlyActuals = (
  contract: ContractControlRecord,
  orders: OrderRecord[]
): Map<string, MonthActual> => {
  const actuals = new Map<string, MonthActual>();
  const ensure = (key: string) => {
    if (!actuals.has(key)) {
      actuals.set(key, { fulfilledKg: 0, fulfilledBags: 0, openKg: 0, openBags: 0 });
    }
    return actuals.get(key)!;
  };

  getDispatchHistory(contract).forEach((entry) => {
    const key = dateToMonthKey(toDate(entry.createdAt));
    if (!key) return;
    const row = ensure(key);
    (entry.lines || []).forEach((line) => {
      row.fulfilledKg += parseMaybeNumber(line.kg);
      row.fulfilledBags += parseMaybeNumber(line.bags);
    });
  });

  orders.forEach((order) => {
    const matchingItems = (order.items || []).filter(
      (item) => item.sourceType === "contract_reserved" && item.contractId === contract.id
    );
    if (!matchingItems.length) return;

    const key = dateToMonthKey(order.preferredDeliveryDate || order.createdAt);
    if (!key) return;
    const row = ensure(key);
    matchingItems.forEach((item) => {
      const kg = kgForOrderItem(item);
      const bags = parseMaybeNumber(item.bags);
      if (isFulfilledOrderStatus(order.status)) {
        row.fulfilledKg += kg;
        row.fulfilledBags += bags;
      } else if (isOpenOrderStatus(order.status)) {
        row.openKg += kg;
        row.openBags += bags;
      }
    });
  });

  return actuals;
};

const buildRow = (contract: ContractControlRecord, orders: OrderRecord[]): ContractControlRow | null => {
  const { startMonth, endMonth } = inferPeriod(contract);
  if (!/^\d{4}-\d{2}$/.test(startMonth) || !/^\d{4}-\d{2}$/.test(endMonth)) return null;

  const totals = contractTotals(contract);
  if (totals.totalKg <= 0) return null;

  const monthKeys = monthKeysBetween(startMonth, endMonth);
  if (!monthKeys.length) return null;

  const todayKey = currentMonthKey();
  const totalMonths = monthKeys.length;
  const monthlyTargets = buildMonthlyTargets(contract, totalMonths);
  const originalPaceKg = monthlyTargets[0]?.expectedKg || totals.totalKg / totalMonths;
  const originalPaceBags = monthlyTargets[0]?.expectedBags || Math.floor(totals.totalBags / totalMonths);
  const fulfilledKg = Math.max(0, totals.totalKg - totals.remainingKg);
  const fulfilledBags = Math.max(0, totals.totalBags - totals.remainingBags);
  const completionPct = totals.totalKg > 0 ? Math.round((fulfilledKg / totals.totalKg) * 100) : 0;
  const elapsedMonths =
    todayKey < startMonth
      ? 0
      : Math.min(totalMonths, monthDiffInclusive(startMonth, todayKey));
  const expectedToDateKg = Math.min(
    totals.totalKg,
    monthlyTargets.slice(0, elapsedMonths).reduce((sum, target) => sum + target.expectedKg, 0)
  );
  const balanceKg = fulfilledKg - expectedToDateKg;
  const monthsLeft = todayKey > endMonth ? 0 : Math.max(1, monthDiffInclusive(todayKey < startMonth ? startMonth : todayKey, endMonth));
  const averageRemainingBagKg = totals.remainingBags > 0 ? totals.remainingKg / totals.remainingBags : 0;
  const recommendedPaceBags = monthsLeft > 0 ? Math.ceil(totals.remainingBags / monthsLeft) : 0;
  const recommendedPaceKg = recommendedPaceBags * averageRemainingBagKg;
  const suggestedNextBags = totals.remainingBags > 0 ? Math.max(1, recommendedPaceBags) : 0;
  const monthlyActuals = getMonthlyActuals(contract, orders);

  let cumulativeActualKg = 0;
  const cells: MonthCell[] = monthKeys.map((key, index) => {
    const monthly = monthlyActuals.get(key);
    const target = monthlyTargets[index] || { expectedKg: originalPaceKg, expectedBags: originalPaceBags };
    const expectedKg = target.expectedKg;
    const expectedBags = target.expectedBags;
    const actualKg = monthly?.fulfilledKg || 0;
    const actualBags = monthly?.fulfilledBags || 0;
    const openKg = monthly?.openKg || 0;
    const openBags = monthly?.openBags || 0;
    cumulativeActualKg += actualKg;
    const cumulativeExpectedKg = Math.min(
      totals.totalKg,
      monthlyTargets.slice(0, index + 1).reduce((sum, item) => sum + item.expectedKg, 0)
    );
    const monthBalance = cumulativeActualKg - cumulativeExpectedKg;
    const isFuture = key > todayKey;
    const isCurrent = key === todayKey;
    const wasCoveredByPrevious = actualKg <= 0 && cumulativeActualKg >= cumulativeExpectedKg;
    let state: MonthCell["state"] = "future";

    if (isFuture) state = "future";
    else if (monthBalance > originalPaceKg * 0.25) state = "ahead";
    else if (wasCoveredByPrevious) state = "covered";
    else if (cumulativeActualKg >= cumulativeExpectedKg) state = "complete";
    else if (actualKg > 0 || openKg > 0) state = "partial";
    else if (isCurrent) state = "due";
    else state = "missed";

    return {
      key,
      label: monthLabel(key),
      expectedKg,
      expectedBags,
      actualKg,
      actualBags,
      openKg,
      openBags,
      cumulativeExpectedKg,
      cumulativeActualKg,
      balanceKg: monthBalance,
      state,
    };
  });

  const openOrderKg = Array.from(monthlyActuals.values()).reduce((sum, item) => sum + item.openKg, 0);
  const knownMonthlyKg = Array.from(monthlyActuals.values()).reduce((sum, item) => sum + item.fulfilledKg, 0);
  const unallocatedKg = Math.max(0, fulfilledKg - knownMonthlyKg);
  let status: ContractControlRow["status"] = "on_track";
  if (totals.remainingKg > 0 && todayKey > endMonth) status = "needs_extension";
  else if (balanceKg < -Math.max(1, originalPaceKg * 0.2)) status = "behind";
  else if (balanceKg > Math.max(1, originalPaceKg * 0.2)) status = "ahead";
  else if (todayKey >= startMonth && todayKey <= endMonth) status = "due";

  return {
    contract,
    customer: contract.name || contract.details?.customer?.fullName || contract.email || "Unknown customer",
    contractNo: contract.contractNo || contract.id,
    periodLabel: `${monthLabel(startMonth)} - ${monthLabel(endMonth)}`,
    startMonth,
    endMonth,
    monthKeys,
    totalKg: totals.totalKg,
    totalBags: totals.totalBags,
    remainingKg: totals.remainingKg,
    remainingBags: totals.remainingBags,
    fulfilledKg,
    fulfilledBags,
    completionPct,
    originalPaceKg,
    originalPaceBags,
    recommendedPaceKg,
    recommendedPaceBags,
    suggestedNextBags,
    expectedToDateKg,
    balanceKg,
    monthsLeft,
    knownMonthlyKg,
    unallocatedKg,
    openOrderKg,
    status,
    cells,
  };
};

const fmtKg = (value: number) => `${Math.round(value).toLocaleString()} kg`;
const fmtBags = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)} bags`;

const statusMeta: Record<ContractControlRow["status"], { label: string; className: string }> = {
  on_track: { label: "On track", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  due: { label: "Due now", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ahead: { label: "Ahead", className: "bg-teal-50 text-teal-700 border-teal-200" },
  behind: { label: "Behind", className: "bg-amber-50 text-amber-700 border-amber-200" },
  needs_extension: { label: "Needs extension", className: "bg-red-50 text-red-700 border-red-200" },
};

const cellClass = (state: MonthCell["state"]) => {
  switch (state) {
    case "ahead":
      return "bg-[#0b5a43] text-white border-[#0b5a43]";
    case "complete":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "covered":
      return "bg-teal-50 text-teal-800 border-teal-200";
    case "partial":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "due":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "missed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-400 border-gray-200";
  }
};

const cellLabel = (cell: MonthCell) => {
  if (cell.state === "future") return "Future";
  if (cell.state === "covered") return "Covered";
  if (cell.state === "ahead") return "Ahead";
  if (cell.state === "complete") return "OK";
  if (cell.state === "partial") return cell.openKg > 0 ? "Open" : "Partial";
  if (cell.state === "due") return "Due";
  return "Missed";
};

const ContractControl: React.FC = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<ContractControlRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractControlRow["status"]>("all");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/getContracts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error("Failed to load contracts");
      const contractData = await response.json();
      setContracts(Array.isArray(contractData) ? contractData : []);

      const db = getFirestore();
      const ordersSnap = await getDocs(collection(db, "orders"));
      const loadedOrders: OrderRecord[] = [];
      ordersSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        loadedOrders.push({
          id: docSnap.id,
          status: data.status || "pending",
          createdAt: toDate(data.createdAt),
          preferredDeliveryDate: toDate(data.preferredDeliveryDate),
          items: Array.isArray(data.items) ? data.items : [],
        });
      });
      setOrders(loadedOrders);
    } catch (err) {
      console.error("Contract control load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load contract control.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadData();
  }, [currentUser]);

  const rows = useMemo(
    () =>
      contracts
        .filter((contract) => String(contract.status || "").toLowerCase() === "active")
        .map((contract) => buildRow(contract, orders))
        .filter((row): row is ContractControlRow => Boolean(row))
        .sort((a, b) => {
          const priority = {
            needs_extension: 0,
            behind: 1,
            due: 2,
            ahead: 3,
            on_track: 4,
          } satisfies Record<ContractControlRow["status"], number>;
          return priority[a.status] - priority[b.status] || b.remainingKg - a.remainingKg;
        }),
    [contracts, orders]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!term) return true;
      return [row.customer, row.contractNo, row.contract.email].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );
    });
  }, [rows, search, statusFilter]);

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          total: acc.total + 1,
          attention:
            acc.attention + (row.status === "behind" || row.status === "needs_extension" ? 1 : 0),
          remainingKg: acc.remainingKg + row.remainingKg,
          openKg: acc.openKg + row.openOrderKg,
        }),
        { total: 0, attention: 0, remainingKg: 0, openKg: 0 }
      ),
    [rows]
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Loading contract control...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#dbe7df] bg-[#f7fbf8] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5f8375]">
              Contract control
            </p>
            <h3 className="mt-1 text-2xl font-bold text-[#073f2f]">
              Monthly fulfilment calendar
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Track active contracts against their original monthly pace, current remaining coffee
              and recommended pace from today.
            </p>
          </div>
          <button
            onClick={loadData}
            className="h-10 rounded-md border border-[#174B3D] bg-white px-3 text-sm font-semibold text-[#174B3D] hover:bg-[#edf5f1]"
          >
            <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Need attention</p>
            <p className="mt-1 text-2xl font-bold text-[#d24d2f]">{summary.attention}</p>
          </div>
          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Remaining</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{fmtKg(summary.remainingKg)}</p>
          </div>
          <div className="rounded-lg border border-white bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Open orders</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{fmtKg(summary.openKg)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
        <label className="relative flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by customer, email or contract..."
            className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#174B3D] focus:ring-2 focus:ring-[#174B3D]/10"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as any)}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#174B3D] focus:ring-2 focus:ring-[#174B3D]/10"
        >
          <option value="all">All statuses</option>
          <option value="needs_extension">Needs extension</option>
          <option value="behind">Behind</option>
          <option value="due">Due now</option>
          <option value="ahead">Ahead</option>
          <option value="on_track">On track</option>
        </select>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No active contracts match this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => {
            const meta = statusMeta[row.status];
            return (
              <article
                key={row.contract.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="grid gap-4 border-b border-gray-100 p-4 lg:grid-cols-[1.2fr_1.4fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-lg font-bold text-gray-950">{row.contractNo}</h4>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-gray-700">{row.customer}</p>
                    <p className="text-xs text-gray-500">{row.periodLabel}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-md bg-gray-50 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Remaining</p>
                      <p className="font-bold text-[#d24d2f]">{fmtKg(row.remainingKg)}</p>
                      <p className="text-xs text-gray-500">{fmtBags(row.remainingBags)}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Original pace</p>
                      <p className="font-bold text-gray-950">{fmtKg(row.originalPaceKg)}</p>
                      <p className="text-xs text-gray-500">{fmtBags(row.originalPaceBags)} / mo</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Current pace</p>
                      <p className="font-bold text-gray-950">
                        {row.monthsLeft ? fmtKg(row.recommendedPaceKg) : "Extend"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.monthsLeft ? `${fmtBags(row.recommendedPaceBags)} / mo` : "No months left"}
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Next order</p>
                      <p className="font-bold text-gray-950">
                        {row.suggestedNextBags ? `${row.suggestedNextBags} bags` : "Done"}
                      </p>
                      <p className="text-xs text-gray-500">{row.monthsLeft} mo left</p>
                    </div>
                  </div>

                  <div className="min-w-[150px]">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{row.completionPct}% fulfilled</span>
                      <span>{fmtKg(row.fulfilledKg)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-[#174B3D]"
                        style={{ width: `${Math.max(4, Math.min(100, row.completionPct))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {row.balanceKg < -1
                        ? `${fmtKg(Math.abs(row.balanceKg))} behind expected pace`
                        : row.balanceKg > 1
                          ? `${fmtKg(row.balanceKg)} ahead of expected pace`
                          : "Aligned with expected pace"}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto p-4">
                  <div className="flex min-w-max gap-2">
                    {row.cells.map((cell) => (
                      <div
                        key={cell.key}
                                                title={
                          cell.label +
                          ': ' +
                          fmtBags(cell.expectedBags) +
                          ' expected (' +
                          fmtKg(cell.expectedKg) +
                          '), ' +
                          fmtBags(cell.actualBags) +
                          ' fulfilled' +
                          (cell.openBags > 0 ? ', ' + fmtBags(cell.openBags) + ' open' : '')
                        }
                        className={'w-32 rounded-md border p-2 text-left ' + cellClass(cell.state)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold">{cell.label}</p>
                          <span className="text-[10px] font-bold uppercase opacity-80">
                            {cellLabel(cell)}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] opacity-80">Expected</p>
                        <p className="text-sm font-bold">{fmtBags(cell.expectedBags)}</p>
                        <p className="text-[11px] opacity-80">{fmtKg(cell.expectedKg)}</p>
                        <p className="mt-1 text-[11px] opacity-80">
                          {cell.actualBags > 0
                            ? 'Fulfilled ' + fmtBags(cell.actualBags)
                            : cell.openBags > 0
                              ? 'Open ' + fmtBags(cell.openBags)
                              : 'No order yet'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600 md:grid-cols-3">
                  <p>
                    <FontAwesomeIcon icon={faCalendarDays} className="mr-2 text-[#174B3D]" />
                    Expected to date: <b>{fmtKg(row.expectedToDateKg)}</b>
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faArrowTrendUp} className="mr-2 text-[#174B3D]" />
                    Open reserved orders: <b>{fmtKg(row.openOrderKg)}</b>
                  </p>
                  <p>
                    <FontAwesomeIcon
                      icon={row.unallocatedKg > 1 ? faCircleExclamation : faClock}
                      className="mr-2 text-[#174B3D]"
                    />
                    {row.unallocatedKg > 1
                      ? `${fmtKg(row.unallocatedKg)} fulfilled without month detail`
                      : "Monthly tracking is fully allocated"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContractControl;






