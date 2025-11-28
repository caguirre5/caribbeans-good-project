// src/pages/Portal/UserHomeDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BAG_SIZE = 24; // 1 bag = 24 kg

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

interface ApiResponse {
  userId: string;
  stats: ContractsStats;
}

const UserHomeDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<ContractsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // unidad visual: kg o bags de 24kg
  const [unit, setUnit] = useState<'kg' | 'bags'>('kg');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await currentUser?.getIdToken();
        if (!token) {
          setError('You need to be logged in to see your dashboard.');
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_FULL_ENDPOINT}/stats/user/contracts-stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || 'Failed to load stats');
        }

        const data: ApiResponse = await res.json();
        setStats(data.stats);
      } catch (err) {
        console.error('Error loading user stats:', err);
        setError('We could not load your data. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md text-sm">
          {error || 'We could not load your data.'}
        </div>
      </div>
    );
  }

  const {
    totalContracts,
    activeContracts,
    completedContracts,
    cancelledContracts,
    totalKg,
    dispatchedKg,
    remainingKg,
    totalAmountGBP,
    kgByVariety,
    contractsByMonth,
  } = stats;

  // helpers para mostrar según unidad seleccionada
  const formatMainValue = (kg: number) => {
    if (unit === 'kg') return kg.toLocaleString();

    const bags = kg / BAG_SIZE;
    // siempre entero
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

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-[#f5f7fa] to-white rounded-xl p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Welcome back
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            {currentUser?.displayName || 'Your coffee dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quick snapshot of your contracts and dispatches.
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Contracts
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalContracts}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {activeContracts} active · {completedContracts} completed ·{' '}
            {cancelledContracts} cancelled
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Total coffee ({unit === 'kg' ? 'kg' : '24kg bags'})
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatMainValue(totalKg)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatSubLabel(totalKg)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Dispatched ({unit === 'kg' ? 'kg' : '24kg bags'})
          </p>
          <p className="text-2xl font-semibold text-emerald-700">
            {formatMainValue(dispatchedKg)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatSubLabel(dispatchedKg)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Remaining ({unit === 'kg' ? 'kg' : '24kg bags'})
          </p>
          <p className="text-2xl font-semibold text-amber-700">
            {formatMainValue(remainingKg)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatSubLabel(remainingKg)}
          </p>
        </div>
      </div>

      {/* Detail block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By variety */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Coffee by variety
          </h2>
          {kgByVariety.length === 0 ? (
            <p className="text-sm text-gray-500">
              We don’t have variety details for your contracts yet.
            </p>
          ) : (
            <div className="space-y-3">
              {kgByVariety.map((v) => {
                const pct =
                  totalKg > 0
                    ? Math.round((v.totalKg / totalKg) * 100)
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
        </div>

        {/* By month */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Contracts by month
          </h2>
          {contractsByMonth.length === 0 ? (
            <p className="text-sm text-gray-500">
              No contracts have been registered yet.
            </p>
          ) : (
            <div className="space-y-2">
              {contractsByMonth.map((m) => (
                <div
                  key={m.month}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">
                    {m.month} {/* ya viene ordenado desde el backend */}
                  </span>
                  <span className="font-medium text-gray-900">
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-xs text-gray-400">
            Total amount committed:{' '}
            <span className="font-semibold text-gray-700">
              £{totalAmountGBP.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHomeDashboard;
