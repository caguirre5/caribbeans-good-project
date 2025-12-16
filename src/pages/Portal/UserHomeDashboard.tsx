// src/pages/Portal/UserHomeDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// MUI X Charts
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

const BAG_SIZE = 24; // 1 bag = 24 kg

// --------- CONTRACTS TYPES ---------
interface KgByVariety {
  variety: string;
  totalKg: number;
}

interface ContractsByMonth {
  month: string; // "2025-10"
  count: number;
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
  contractsByMonth: ContractsByMonth[];
}

interface ContractsApiResponse {
  userId: string;
  stats: ContractsStats;
}

// --------- ORDERS TYPES (REPLICANDO TU BACKEND) ---------
interface OrderVarietyAgg {
  varietyName: string;
  totalKg: number;
  totalBags: number;
  totalAmountGBP: number;
}

interface SpendByMonth {
  month: string;
  totalAmountGBP: number;
}

interface OrderCountByMonth {
  month: string;
  count: number;
}

interface CountByMethod {
  method: string;
  count: number;
}

interface KgByMethod {
  method: string;
  totalKg: number;
}

interface AmountByMethod {
  method: string;
  totalAmountGBP: number;
}

interface OrdersBasicStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface OrdersVolumeStats {
  totalKg: number;
  totalBags: number;
  avgKgPerOrder: number;
  avgBagsPerOrder: number;
  kgByVariety: OrderVarietyAgg[];
}

interface OrdersFinancialStats {
  totalAmountGBP: number;
  totalSubtotalGBP: number;
  totalDeliveryFeesGBP: number;
  avgOrderValueGBP: number;
  avgDeliveryFeeGBP: number;
  spendByVariety: { varietyName: string; totalAmountGBP: number }[];
  spendByMonth: SpendByMonth[];
}

interface OrdersTimeStats {
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  orderCountByMonth: OrderCountByMonth[];
  daysBetweenFirstAndLast: number | null;
  avgDaysBetweenOrders: number | null;
}

interface OrdersShippingStats {
  countByMethod: CountByMethod[];
  kgByMethod: KgByMethod[];
  amountByMethod: AmountByMethod[];
}

interface OrdersStatsResponse {
  userId: string;
  basic: OrdersBasicStats;
  volume: OrdersVolumeStats;
  financial: OrdersFinancialStats;
  time: OrdersTimeStats;
  shipping: OrdersShippingStats;
}

const UserHomeDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const [contractsStats, setContractsStats] = useState<ContractsStats | null>(null);
  const [ordersStats, setOrdersStats] = useState<OrdersStatsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // unidad visual: kg o bags de 24kg
  const [unit, setUnit] = useState<'kg' | 'bags'>('kg');

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentUser) {
          console.warn('[DASHBOARD] No currentUser found, user not logged in.');
          setError('You need to be logged in to see your dashboard.');
          setLoading(false);
          return;
        }

        const token = await currentUser.getIdToken();
        console.log('[DASHBOARD] currentUser:', {
          uid: currentUser.uid,
          email: currentUser.email,
        });
        console.log('[DASHBOARD] token present?', !!token);

        if (!token) {
          setError('You need to be logged in to see your dashboard.');
          setLoading(false);
          return;
        }

        const baseUrl = import.meta.env.VITE_FULL_ENDPOINT;
        console.log('[DASHBOARD] VITE_FULL_ENDPOINT:', baseUrl);

        if (!baseUrl) {
          console.error('[DASHBOARD] VITE_FULL_ENDPOINT is undefined');
          setError('Configuration error: API endpoint is not set.');
          setLoading(false);
          return;
        }

        // variables locales para evitar depender del estado dentro del mismo efecto
        let localContractsStats: ContractsStats | null = null;
        let localOrdersStats: OrdersStatsResponse | null = null;
        let localError: string | null = null;

        // ---- FETCH CONTRACTS STATS ----
        const contractsUrl = `${baseUrl}/stats/user/contracts-stats`;
        console.log('[DASHBOARD] Fetching contracts stats from:', contractsUrl);

        try {
          const resContracts = await fetch(contractsUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log('[DASHBOARD] Contracts response status:', resContracts.status);

          if (!resContracts.ok) {
            const txt = await resContracts.text().catch(() => '');
            console.error(
              '[DASHBOARD] Contracts stats non-ok response:',
              resContracts.status,
              txt
            );
            localError = `Contracts stats failed (${resContracts.status})`;
          } else {
            const data: ContractsApiResponse = await resContracts.json();
            console.log('[DASHBOARD] Contracts stats data:', data);
            localContractsStats = data.stats;
          }
        } catch (err) {
          console.error('[DASHBOARD] Error fetching contracts stats:', err);
          localError = 'Error fetching contracts stats.';
        }

        // ---- FETCH ORDERS STATS ----
        const ordersUrl = `${baseUrl}/orderStats/orders/stats/me`;
        console.log('[DASHBOARD] Fetching orders stats from:', ordersUrl);

        try {
          const resOrders = await fetch(ordersUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log('[DASHBOARD] Orders response status:', resOrders.status);

          if (!resOrders.ok) {
            const txt = await resOrders.text().catch(() => '');
            console.error(
              '[DASHBOARD] Orders stats non-ok response:',
              resOrders.status,
              txt
            );
            localError = localError
              ? `${localError} | Orders stats failed (${resOrders.status})`
              : `Orders stats failed (${resOrders.status})`;
          } else {
            const data: OrdersStatsResponse = await resOrders.json();
            console.log('[DASHBOARD] Orders stats data:', data);
            localOrdersStats = data;
          }
        } catch (err) {
          console.error('[DASHBOARD] Error fetching orders stats:', err);
          localError = localError
            ? `${localError} | Error fetching orders stats`
            : 'Error fetching orders stats.';
        }

        // aplicar resultados al estado
        setContractsStats(localContractsStats);
        setOrdersStats(localOrdersStats);

        if (!localContractsStats && !localOrdersStats && localError) {
          setError(localError);
        } else if (localError) {
          console.warn('[DASHBOARD] Partial error:', localError);
          setError(localError);
        } else {
          setError(null);
        }
      } catch (err: any) {
        console.error('[DASHBOARD] Unexpected error in fetchAllStats:', err);
        setError(
          'We could not load your data. Debug: ' + (err?.message || 'Unknown error')
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchAllStats();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  const hasAnyData = !!contractsStats || !!ordersStats;

  if (!hasAnyData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md text-sm">
          {error || 'We could not load your data.'}
        </div>
      </div>
    );
  }

  // helpers para mostrar según unidad seleccionada
  const formatMainValue = (kg: number) => {
    if (unit === 'kg') return kg.toLocaleString();
    const bags = kg / BAG_SIZE;
    return bags.toFixed(0);
  };

  const formatSubLabel = (kg: number) => {
    if (unit === 'kg') {
      const bags = kg / BAG_SIZE;
      return `≈ ${bags.toFixed(0)} bags of 24kg`;
    } else {
      return `≈ ${kg.toLocaleString()} kg total`;
    }
  };

  // ------ DATA AUX PARA CHARTS (CONTRACTS) ------
  const contractsByMonthData =
    contractsStats?.contractsByMonth.map((m) => ({
      month: m.month,
      count: m.count,
    })) || [];

  const contractsVarietyPieData =
    contractsStats?.kgByVariety.map((v, idx) => ({
      id: idx,
      label: v.variety,
      value: v.totalKg,
    })) || [];

  // ------ DATA AUX PARA CHARTS (ORDERS) ------
  const ordersByMonthData =
    ordersStats?.time.orderCountByMonth.map((m) => ({
      month: m.month,
      orders: m.count,
    })) || [];

  const ordersVarietyData =
    ordersStats?.volume.kgByVariety.map((v) => ({
      variety: v.varietyName,
      totalKg: v.totalKg,
      totalRevenue: v.totalAmountGBP,
    })) || [];

  const firstOrderDate = ordersStats?.time.firstOrderAt
    ? new Date(ordersStats.time.firstOrderAt).toLocaleDateString('en-GB')
    : '—';
  const lastOrderDate = ordersStats?.time.lastOrderAt
    ? new Date(ordersStats.time.lastOrderAt).toLocaleDateString('en-GB')
    : '—';

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-[#f5f7fa] to-white rounded-xl p-6 md:p-8 space-y-8">
      {/* Banner de error parcial si lo hubo */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs md:text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Welcome back
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            {currentUser?.displayName || 'Your coffee dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Snapshot of your contracts and orders with Caribbean Goods.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl px-4 py-3 text-right shadow-sm">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-gray-800">
              {currentUser?.email}
            </p>
          </div>

          {/* Toggle unidades */}
          <div className="inline-flex items-center bg-gray-900 text-gray-100 rounded-full p-1 text-[11px] shadow-sm">
            <button
              type="button"
              onClick={() => setUnit('kg')}
              className={`px-3 py-1 rounded-full transition-all ${
                unit === 'kg'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-300 hover:text-white'
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit('bags')}
              className={`px-3 py-1 rounded-full transition-all ${
                unit === 'bags'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-300 hover:text-white'
              }`}
            >
              bags
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS: CONTRACTS + ORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Contracts summary */}
        {contractsStats && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Contracts
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {contractsStats.totalContracts}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {contractsStats.activeContracts} active ·{' '}
                {contractsStats.completedContracts} completed ·{' '}
                {contractsStats.cancelledContracts} cancelled
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Contract volume ({unit === 'kg' ? 'kg' : '24kg bags'})
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatMainValue(contractsStats.totalKg)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatSubLabel(contractsStats.totalKg)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Dispatched ({unit === 'kg' ? 'kg' : '24kg bags'})
              </p>
              <p className="text-2xl font-semibold text-emerald-700">
                {formatMainValue(contractsStats.dispatchedKg)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatSubLabel(contractsStats.dispatchedKg)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Remaining ({unit === 'kg' ? 'kg' : '24kg bags'})
              </p>
              <p className="text-2xl font-semibold text-amber-700">
                {formatMainValue(contractsStats.remainingKg)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatSubLabel(contractsStats.remainingKg)}
              </p>
            </div>
          </>
        )}

        {/* Orders summary */}
        {ordersStats && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Orders
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {ordersStats.basic.totalOrders}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {ordersStats.basic.activeOrders} active ·{' '}
                {ordersStats.basic.cancelledOrders} cancelled
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Ordered volume ({unit === 'kg' ? 'kg' : '24kg bags'})
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatMainValue(ordersStats.volume.totalKg)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatSubLabel(ordersStats.volume.totalKg)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Average order size
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {unit === 'kg'
                  ? ordersStats.volume.avgKgPerOrder.toFixed(1)
                  : (ordersStats.volume.avgKgPerOrder / BAG_SIZE).toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {unit === 'kg'
                  ? `kg per order`
                  : `24kg bags per order`}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Lifetime spend
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                £{ordersStats.financial.totalAmountGBP.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Avg. £{ordersStats.financial.avgOrderValueGBP.toFixed(2)} per
                order
              </p>
            </div>
          </>
        )}
      </div>

      {/* DETAIL SECTION: CONTRACTS & ORDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONTRACTS detail */}
        {contractsStats && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Contracts by variety
            </h2>
            {contractsStats.kgByVariety.length === 0 ? (
              <p className="text-sm text-gray-500">
                We don’t have variety details for your contracts yet.
              </p>
            ) : (
              <div className="space-y-3">
                {contractsStats.kgByVariety.map((v) => {
                  const pct =
                    contractsStats.totalKg > 0
                      ? Math.round((v.totalKg / contractsStats.totalKg) * 100)
                      : 0;

                  return (
                    <div key={v.variety}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-800">
                          {v.variety}
                        </span>
                        <span className="text-gray-500">
                          {v.totalKg.toLocaleString()} kg · {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200/80 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500">
              Total contract value:{' '}
              <span className="font-semibold text-gray-700">
                £{contractsStats.totalAmountGBP.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* ORDERS detail */}
        {ordersStats && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Orders by variety
            </h2>
            {ordersStats.volume.kgByVariety.length === 0 ? (
              <p className="text-sm text-gray-500">
                We don’t have variety details for your orders yet.
              </p>
            ) : (
              <div className="space-y-3">
                {ordersStats.volume.kgByVariety.map((v) => {
                  const pct =
                    ordersStats.volume.totalKg > 0
                      ? Math.round((v.totalKg / ordersStats.volume.totalKg) * 100)
                      : 0;

                  return (
                    <div key={v.varietyName}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-800">
                          {v.varietyName}
                        </span>
                        <span className="text-gray-500">
                          {v.totalKg.toLocaleString()} kg · {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200/80 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500 space-y-1">
              <p>
                First order:{' '}
                <span className="font-medium text-gray-700">
                  {firstOrderDate}
                </span>
              </p>
              <p>
                Last order:{' '}
                <span className="font-medium text-gray-700">
                  {lastOrderDate}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CHARTS SECTION */}
      <div className="mt-4 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Visual overview
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chart: Contracts by month */}
          {contractsByMonthData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Contracts by month
              </h3>
              <BarChart
                dataset={contractsByMonthData}
                xAxis={[{ dataKey: 'month', scaleType: 'band' }]}
                series={[{ dataKey: 'count', label: 'Contracts' }]}
                height={320}
              />
            </div>
          )}

          {/* Chart: Orders by month */}
          {ordersByMonthData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Orders by month
              </h3>
              <BarChart
                dataset={ordersByMonthData}
                xAxis={[{ dataKey: 'month', scaleType: 'band' }]}
                series={[{ dataKey: 'orders', label: 'Orders' }]}
                height={320}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pie: Contracts variety */}
          {contractsVarietyPieData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 self-start">
                Contracted volume by variety
              </h3>
              <PieChart
                series={[
                  {
                    data: contractsVarietyPieData,
                    innerRadius: 40,
                    outerRadius: 110,
                    paddingAngle: 2,
                  },
                ]}
                height={320}
              />
            </div>
          )}

          {/* Bar: Orders variety */}
          {ordersVarietyData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Orders by variety (kg & revenue)
              </h3>
              <BarChart
                dataset={ordersVarietyData}
                xAxis={[{ dataKey: 'variety', scaleType: 'band' }]}
                series={[
                  { dataKey: 'totalKg', label: 'Total kg' },
                  { dataKey: 'totalRevenue', label: 'Revenue (£)' },
                ]}
                height={320}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHomeDashboard;
