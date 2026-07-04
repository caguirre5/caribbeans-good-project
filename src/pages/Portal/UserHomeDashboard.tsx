// src/pages/Portal/UserHomeDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
import GuatemalaSeasonCalendar from "../../components/SeasonCalendar";

const DEFAULT_BAG_KG = 24;

interface KgByVariety {
  variety: string;
  totalKg: number;
}

interface ContractsStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  totalKg: number;
  dispatchedKg: number;
  remainingKg: number;
  totalAmountGBP: number;
  kgByVariety: KgByVariety[];
  contractsByMonth: Array<{ month: string; count: number }>;
}

interface ContractsApiResponse {
  userId: string;
  stats: ContractsStats;
}

interface OrdersStatsResponse {
  userId: string;
  basic: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  volume: {
    totalKg: number;
    totalBags: number;
    avgKgPerOrder: number;
    avgBagsPerOrder: number;
    kgByVariety: Array<{
      varietyName: string;
      totalKg: number;
      totalBags: number;
      totalAmountGBP: number;
    }>;
  };
  financial: {
    totalAmountGBP: number;
    avgOrderValueGBP: number;
  };
  time: {
    firstOrderAt: string | null;
    lastOrderAt: string | null;
  };
}

type ContractSelection = {
  variety?: string;
  bags?: number | string;
  bagKg?: number | string;
  lineKg?: number | string;
  unitPricePerKg?: number | string;
  lineSubtotal?: number | string;
  remainingBags?: number | string;
  remainingKg?: number | string;
};

type Contract = {
  id: string;
  contractNo?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  createdAt?: any;
  details?: {
    selections?: ContractSelection[];
    totals?: {
      pricePerBagKg?: number | string;
      totalAmountGBP?: number | string;
      totalKg?: number | string;
    };
  } | null;
  reservation?: {
    startMonth?: string;
    endMonth?: string;
    frequency?: string;
    months?: number | string;
  } | null;
  selections?: ContractSelection[] | null;
  totals?: {
    pricePerBagKg?: number | string;
    totalAmountGBP?: number | string;
    totalKg?: number | string;
  } | null;
};

type ContractLineMetric = {
  variety: string;
  totalBags: number;
  remainingBags: number;
  dispatchedBags: number;
  bagKg: number;
  totalKg: number;
  remainingKg: number;
  dispatchedKg: number;
};

type ContractMetric = {
  id: string;
  contractNo: string;
  status: string;
  startMonth?: string;
  endMonth?: string;
  frequency?: string;
  totalBags: number;
  remainingBags: number;
  dispatchedBags: number;
  totalKg: number;
  remainingKg: number;
  dispatchedKg: number;
  completionPct: number;
  lines: ContractLineMetric[];
};

const parseNum = (value: unknown, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

const clampPct = (value: number) => Math.max(0, Math.min(100, value));

const formatMonth = (value?: string) => {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value || 0);

const statusLabel = (status?: string | null) =>
  String(status || "unknown")
    .replace(/_/g, " ")
    .trim();

const getSelections = (contract: Contract) =>
  Array.isArray(contract.details?.selections)
    ? contract.details?.selections || []
    : Array.isArray(contract.selections)
      ? contract.selections || []
      : [];

const metricFromContract = (contract: Contract): ContractMetric => {
  const totals = contract.details?.totals || contract.totals || {};
  const defaultBagKg = parseNum(totals.pricePerBagKg, DEFAULT_BAG_KG);

  const lines = getSelections(contract).map((selection) => {
    const bagKg = parseNum(selection.bagKg, defaultBagKg);
    const totalBags = parseNum(selection.bags);
    const totalKg = parseNum(selection.lineKg, totalBags * bagKg);
    const remainingBags = parseNum(selection.remainingBags, totalBags);
    const remainingKg = parseNum(selection.remainingKg, remainingBags * bagKg);
    const dispatchedBags = Math.max(0, totalBags - remainingBags);
    const dispatchedKg = Math.max(0, totalKg - remainingKg);

    return {
      variety: String(selection.variety || "Contract coffee"),
      totalBags,
      remainingBags,
      dispatchedBags,
      bagKg,
      totalKg,
      remainingKg,
      dispatchedKg,
    };
  });

  const totalBags = lines.reduce((sum, line) => sum + line.totalBags, 0);
  const remainingBags = lines.reduce((sum, line) => sum + line.remainingBags, 0);
  const dispatchedBags = lines.reduce((sum, line) => sum + line.dispatchedBags, 0);
  const totalKg = lines.reduce((sum, line) => sum + line.totalKg, 0);
  const remainingKg = lines.reduce((sum, line) => sum + line.remainingKg, 0);
  const dispatchedKg = lines.reduce((sum, line) => sum + line.dispatchedKg, 0);
  const completionPct = totalKg > 0 ? clampPct(Math.round((dispatchedKg / totalKg) * 100)) : 0;

  return {
    id: contract.id,
    contractNo: contract.contractNo || contract.id,
    status: statusLabel(contract.status),
    startMonth: contract.reservation?.startMonth,
    endMonth: contract.reservation?.endMonth,
    frequency: contract.reservation?.frequency,
    totalBags,
    remainingBags,
    dispatchedBags,
    totalKg,
    remainingKg,
    dispatchedKg,
    completionPct,
    lines,
  };
};

const UserHomeDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [contractsStats, setContractsStats] = useState<ContractsStats | null>(null);
  const [ordersStats, setOrdersStats] = useState<OrdersStatsResponse | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<"kg" | "bags">("kg");

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!currentUser) {
        setLoading(false);
        setError("You need to be logged in to see your dashboard.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await currentUser.getIdToken();
        const baseUrl = import.meta.env.VITE_FULL_ENDPOINT;
        if (!baseUrl) throw new Error("API endpoint is not configured.");

        const [contractsStatsRes, ordersStatsRes, contractsRes] = await Promise.allSettled([
          fetch(`${baseUrl}/stats/user/contracts-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/orderStats/orders/stats/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/api/getContracts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const partialErrors: string[] = [];

        if (contractsStatsRes.status === "fulfilled" && contractsStatsRes.value.ok) {
          const data: ContractsApiResponse = await contractsStatsRes.value.json();
          setContractsStats(data.stats);
        } else {
          partialErrors.push("contracts summary");
          setContractsStats(null);
        }

        if (ordersStatsRes.status === "fulfilled" && ordersStatsRes.value.ok) {
          const data: OrdersStatsResponse = await ordersStatsRes.value.json();
          setOrdersStats(data);
        } else {
          partialErrors.push("orders summary");
          setOrdersStats(null);
        }

        if (contractsRes.status === "fulfilled" && contractsRes.value.ok) {
          const data: Contract[] = await contractsRes.value.json();
          const email = currentUser.email?.toLowerCase();
          setContracts(
            email
              ? data.filter((contract) => contract.email?.toLowerCase() === email)
              : data
          );
        } else {
          partialErrors.push("contract details");
          setContracts([]);
        }

        setError(
          partialErrors.length
            ? `Some dashboard data could not be loaded: ${partialErrors.join(", ")}.`
            : null
        );
      } catch (err: any) {
        console.error("[DASHBOARD] Unexpected error:", err);
        setError(err?.message || "We could not load your dashboard.");
        setContractsStats(null);
        setOrdersStats(null);
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [currentUser]);

  const activeContractMetrics = useMemo(
    () =>
      contracts
        .filter((contract) => ["active", "processing"].includes(String(contract.status || "").toLowerCase()))
        .map(metricFromContract)
        .filter((metric) => metric.totalKg > 0 || metric.remainingKg > 0),
    [contracts]
  );

  const hasActiveContracts = activeContractMetrics.length > 0;

  const formatVolume = (kg: number) => {
    if (unit === "kg") return `${Math.round(kg).toLocaleString()} kg`;
    return `${Math.round(kg / DEFAULT_BAG_KG).toLocaleString()} bags`;
  };

  const formatVolumeSub = (kg: number) => {
    if (unit === "kg") return `${Math.round(kg / DEFAULT_BAG_KG).toLocaleString()} bags`;
    return `${Math.round(kg).toLocaleString()} kg`;
  };

  const formatContractVolume = (kg: number, bags: number) => {
    if (unit === "kg") return `${Math.round(kg).toLocaleString()} kg`;
    return `${Math.round(bags).toLocaleString()} bags`;
  };

  const formatContractVolumeSub = (kg: number, bags: number) => {
    if (unit === "kg") return `${Math.round(bags).toLocaleString()} bags`;
    return `${Math.round(kg).toLocaleString()} kg`;
  };

  const totalActiveRemainingKg = activeContractMetrics.reduce(
    (sum, metric) => sum + metric.remainingKg,
    0
  );
  const totalActiveRemainingBags = activeContractMetrics.reduce(
    (sum, metric) => sum + metric.remainingBags,
    0
  );
  const totalActiveDispatchedKg = activeContractMetrics.reduce(
    (sum, metric) => sum + metric.dispatchedKg,
    0
  );
  const totalActiveDispatchedBags = activeContractMetrics.reduce(
    (sum, metric) => sum + metric.dispatchedBags,
    0
  );
  const totalActiveKg = activeContractMetrics.reduce((sum, metric) => sum + metric.totalKg, 0);
  const totalActiveBags = activeContractMetrics.reduce((sum, metric) => sum + metric.totalBags, 0);
  const activeCompletionPct =
    totalActiveKg > 0 ? clampPct(Math.round((totalActiveDispatchedKg / totalActiveKg) * 100)) : 0;
  const activeVarietyCount = new Set(
    activeContractMetrics.flatMap((metric) => metric.lines.map((line) => line.variety))
  ).size;
  const nextContractEndMonth =
    activeContractMetrics
      .map((metric) => metric.endMonth)
      .filter((month): month is string => Boolean(month))
      .sort()[0] || "";
  const summaryContractTotalKg = hasActiveContracts ? totalActiveKg : contractsStats?.totalKg || 0;
  const summaryContractCollectedKg = hasActiveContracts
    ? totalActiveDispatchedKg
    : contractsStats?.dispatchedKg || 0;
  const summaryContractRemainingKg = hasActiveContracts
    ? totalActiveRemainingKg
    : contractsStats?.remainingKg || 0;
  const summaryContractCount = hasActiveContracts
    ? activeContractMetrics.length
    : contractsStats?.activeContracts || 0;
  const summaryContractProgressPct =
    summaryContractTotalKg > 0
      ? clampPct(Math.round((summaryContractCollectedKg / summaryContractTotalKg) * 100))
      : 0;
  const totalOrders = ordersStats?.basic.totalOrders || 0;
  const completedOrders = ordersStats?.basic.completedOrders || 0;
  const cancelledOrders = ordersStats?.basic.cancelledOrders || 0;
  const visibleOrders = Math.max(0, totalOrders - cancelledOrders);
  const openOrders = Math.max(0, visibleOrders - completedOrders);
  const orderCompletionPct =
    visibleOrders > 0 ? clampPct(Math.round((completedOrders / visibleOrders) * 100)) : 0;
  const firstOrderDate = ordersStats?.time.firstOrderAt
    ? new Date(ordersStats.time.firstOrderAt).toLocaleDateString("en-GB")
    : "-";
  const lastOrderDate = ordersStats?.time.lastOrderAt
    ? new Date(ordersStats.time.lastOrderAt).toLocaleDateString("en-GB")
    : "-";

  if (loading) {
    return (
      <div className="rounded-[22px] border border-[#044421]/10 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#044421]/60">Loading your dashboard...</p>
      </div>
    );
  }

  const DashboardHeader = (
    <header className="border-b border-[#044421]/10 pb-5">
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <p className="text-xs tracking-widest uppercase text-[#044421]/60">Overview</p>
          <div className="mt-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#044421]"
              style={{ fontFamily: "KingsThing" }}
            >
              Dashboard overview
            </h1>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <a
                href="https://www.youtube.com/@caribbeangoods8639"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-[#044421]/15 bg-white shadow-sm hover:bg-[#044421]/5 transition"
              >
                <FontAwesomeIcon icon={faYoutube} className="text-[#cc0000]" />
                YouTube
              </a>

              <a
                href="https://open.spotify.com/show/6JKyBk5hZD8QxqF1mVFINf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-[#044421]/15 bg-white shadow-sm hover:bg-[#044421]/5 transition"
              >
                <FontAwesomeIcon icon={faSpotify} className="text-[#1DB954]" />
                Spotify
              </a>
            </div>
          </div>

          <p className="mt-2 max-w-3xl text-sm md:text-base text-[#044421]/70">
            Quick snapshot of your contracts and orders, plus access to prices, resources and ordering.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#044421]/55">Welcome back</p>
              <p className="text-2xl md:text-3xl font-semibold text-gray-950">
                {currentUser?.displayName || "Your coffee dashboard"}
              </p>
            </div>

            <div className="sm:ml-4 rounded-2xl border border-[#044421]/10 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-800 break-all">{currentUser?.email}</p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-full bg-gray-950 p-1 text-xs font-semibold text-white shadow-sm">
            <button
              type="button"
              onClick={() => setUnit("kg")}
              className={`rounded-full px-4 py-2 transition ${unit === "kg" ? "bg-white text-gray-950" : "text-white/70"}`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit("bags")}
              className={`rounded-full px-4 py-2 transition ${unit === "bags" ? "bg-white text-gray-950" : "text-white/70"}`}
            >
              bags
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const ActiveContractsBlock = hasActiveContracts ? (
    <section className="rounded-[24px] border border-[#044421]/10 bg-[#043f24] text-white shadow-sm overflow-hidden">
      <div className="p-5 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">Active contracts</p>
            <h2
              className="mt-1 text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "KingsThing" }}
            >
              Reserved coffee at a glance
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              These coffees are held for you. Order from your reserved volume whenever you are ready.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/8 p-2 text-center">
            <div className="px-2 py-2">
              <p className="text-lg font-semibold">{activeContractMetrics.length}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/55">contracts</p>
            </div>
            <div className="px-2 py-2">
              <p className="text-lg font-semibold">
                {formatContractVolume(totalActiveRemainingKg, totalActiveRemainingBags)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-white/55">remaining</p>
            </div>
            <div className="px-2 py-2">
              <p className="text-lg font-semibold">{activeCompletionPct}%</p>
              <p className="text-[10px] uppercase tracking-wide text-white/55">collected</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {activeContractMetrics.map((contract) => (
            <article
              key={contract.id}
              className="rounded-[20px] border border-white/10 bg-white text-gray-950 p-4 md:p-5 shadow-sm"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(190px,0.9fr)_minmax(260px,1.2fr)_minmax(360px,1.6fr)] gap-4 xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{contract.contractNo}</h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {contract.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {[formatMonth(contract.startMonth), formatMonth(contract.endMonth)]
                      .filter(Boolean)
                      .join(" to ") || "Contract period"}
                    {contract.frequency ? ` - ${contract.frequency}` : ""}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-[#f6faf7] grid place-items-center">
                      <span className="text-lg font-semibold text-[#044421]">{contract.completionPct}%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Collected progress</p>
                      <div className="mt-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ce5231]"
                          style={{ width: `${contract.completionPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">contracted</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatContractVolume(contract.totalKg, contract.totalBags)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatContractVolumeSub(contract.totalKg, contract.totalBags)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">collected</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatContractVolume(contract.dispatchedKg, contract.dispatchedBags)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatContractVolumeSub(contract.dispatchedKg, contract.dispatchedBags)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">remaining</p>
                    <p className="mt-1 text-sm font-semibold text-[#ce5231]">
                      {formatContractVolume(contract.remainingKg, contract.remainingBags)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formatContractVolumeSub(contract.remainingKg, contract.remainingBags)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {contract.lines.slice(0, 3).map((line) => {
                    const pct = line.totalKg > 0 ? clampPct(Math.round((line.dispatchedKg / line.totalKg) * 100)) : 0;
                    return (
                      <div key={`${contract.id}-${line.variety}`}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-gray-800 truncate">{line.variety}</span>
                          <span className="shrink-0 text-gray-500">
                            {formatContractVolume(line.remainingKg, line.remainingBags)} left
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {contract.lines.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{contract.lines.length - 3} more varieties
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  ) : null;

  const SummaryBlock = (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#044421]/55">Summary</p>
          <h2 className="text-xl font-semibold text-gray-950">Your activity</h2>
        </div>
        <p className="text-xs text-gray-500">
          Orders: {firstOrderDate} to {lastOrderDate}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Contract progress"
          value={summaryContractTotalKg > 0 ? `${summaryContractProgressPct}%` : "-"}
          sub={
            summaryContractTotalKg > 0
              ? `${
                  hasActiveContracts
                    ? formatContractVolume(summaryContractCollectedKg, totalActiveDispatchedBags)
                    : formatVolume(summaryContractCollectedKg)
                } collected`
              : "No active contract volume"
          }
        />
        <MetricCard
          label="Reserved left"
          value={
            summaryContractTotalKg > 0
              ? hasActiveContracts
                ? formatContractVolume(summaryContractRemainingKg, totalActiveRemainingBags)
                : formatVolume(summaryContractRemainingKg)
              : "-"
          }
          sub={
            summaryContractTotalKg > 0
              ? `${
                  hasActiveContracts
                    ? formatContractVolumeSub(summaryContractRemainingKg, totalActiveRemainingBags)
                    : formatVolumeSub(summaryContractRemainingKg)
                } remaining`
              : "No reserved coffee"
          }
          accent="text-[#ce5231]"
        />
        <MetricCard
          label="Orders"
          value={ordersStats ? String(visibleOrders) : "-"}
          sub={
            ordersStats
              ? `${openOrders} open - ${completedOrders} completed`
              : "No order data"
          }
        />
        <MetricCard
          label="Spend"
          value={ordersStats ? formatMoney(ordersStats.financial.totalAmountGBP) : "-"}
          sub={ordersStats ? `Avg ${formatMoney(ordersStats.financial.avgOrderValueGBP)} / order` : "No order data"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[20px] border border-[#044421]/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">Contract snapshot</h3>
              <p className="mt-1 text-xs text-gray-500">
                {summaryContractCount > 0
                  ? `${summaryContractCount} active contract${summaryContractCount === 1 ? "" : "s"} - combined view`
                  : "No active contracts yet"}
              </p>
            </div>
            <span className="rounded-full bg-[#f6faf7] px-3 py-1 text-xs font-semibold text-[#044421]">
              {summaryContractProgressPct}% collected
            </span>
          </div>

          <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#ce5231]"
              style={{ width: `${summaryContractProgressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {summaryContractTotalKg > 0
              ? `${
                  hasActiveContracts
                    ? formatContractVolume(summaryContractCollectedKg, totalActiveDispatchedBags)
                    : formatVolume(summaryContractCollectedKg)
                } collected of ${
                  hasActiveContracts
                    ? formatContractVolume(summaryContractTotalKg, totalActiveBags)
                    : formatVolume(summaryContractTotalKg)
                } across active contracts`
              : "Contract progress will appear here once a contract is active."}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SummaryFact
              label="Reserved left"
              value={
                hasActiveContracts
                  ? formatContractVolume(summaryContractRemainingKg, totalActiveRemainingBags)
                  : formatVolume(summaryContractRemainingKg)
              }
            />
            <SummaryFact
              label="Collected"
              value={
                hasActiveContracts
                  ? formatContractVolume(summaryContractCollectedKg, totalActiveDispatchedBags)
                  : formatVolume(summaryContractCollectedKg)
              }
            />
            <SummaryFact label="Varieties" value={String(activeVarietyCount || contractsStats?.kgByVariety.length || 0)} />
            <SummaryFact label="Next end" value={formatMonth(nextContractEndMonth) || "-"} />
          </div>
        </div>

        <div className="rounded-[20px] border border-[#044421]/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">Order snapshot</h3>
              <p className="mt-1 text-xs text-gray-500">
                {visibleOrders > 0 ? `${firstOrderDate} to ${lastOrderDate}` : "No orders yet"}
              </p>
            </div>
            <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-xs font-semibold text-[#ce5231]">
              {orderCompletionPct}% completed
            </span>
          </div>

          <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#044421]"
              style={{ width: `${orderCompletionPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {visibleOrders > 0
              ? `${completedOrders} completed from ${visibleOrders} orders`
              : "Order activity will appear here once you place an order."}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SummaryFact label="Volume" value={ordersStats ? formatVolume(ordersStats.volume.totalKg) : "-"} />
            <SummaryFact label="Avg/order" value={ordersStats ? formatVolume(ordersStats.volume.avgKgPerOrder) : "-"} />
            <SummaryFact label="Open" value={ordersStats ? String(openOrders) : "-"} />
            <SummaryFact label="Completed" value={ordersStats ? String(completedOrders) : "-"} />
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="w-full space-y-5">
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {DashboardHeader}

      {hasActiveContracts ? (
        <>
          {ActiveContractsBlock}
          {SummaryBlock}
          <GuatemalaSeasonCalendar />
        </>
      ) : (
        <>
          <GuatemalaSeasonCalendar />
          {SummaryBlock}
        </>
      )}
    </div>
  );
};

function MetricCard({
  label,
  value,
  sub,
  accent = "text-gray-950",
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#044421]/10 bg-white p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-gray-50 px-3 py-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-950" title={value}>
        {value}
      </p>
    </div>
  );
}

export default UserHomeDashboard;
