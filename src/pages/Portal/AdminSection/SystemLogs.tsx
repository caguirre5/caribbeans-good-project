import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

type SystemLog = {
  id: string;
  action?: string | null;
  level?: "info" | "warning" | "error" | string | null;
  status?: "started" | "success" | "failed" | string | null;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  error?: {
    message?: string | null;
    name?: string | null;
    code?: string | null;
    stack?: string | null;
  } | null;
  createdAt?: any;
};

const statusClass = (status?: string | null) => {
  if (status === "failed") return "bg-red-50 text-red-700 border-red-200";
  if (status === "started") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

const levelClass = (level?: string | null) => {
  if (level === "error") return "text-red-700";
  if (level === "warning") return "text-amber-700";
  return "text-gray-600";
};

const formatDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stringify = (value: unknown) =>
  JSON.stringify(value ?? null, null, 2);

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const db = getFirestore();
      const snap = await getDocs(
        query(collection(db, "systemLogs"), orderBy("createdAt", "desc"), limit(100))
      );

      setLogs(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SystemLog, "id">),
        }))
      );
    } catch (err) {
      console.error("Failed to load system logs:", err);
      setError("Failed to load system logs. Check Firestore rules for /systemLogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (levelFilter && log.level !== levelFilter) return false;
      if (statusFilter && log.status !== statusFilter) return false;

      if (!term) return true;

      return [
        log.action,
        log.level,
        log.status,
        log.actorEmail,
        log.targetType,
        log.targetId,
        log.targetLabel,
        log.error?.message,
        stringify(log.context),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [logs, levelFilter, statusFilter, search]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">System logs</h2>
          <p className="text-sm text-gray-500">
            Recent operational actions, Firebase writes and captured errors.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="px-3 py-2 rounded border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order, contract, actor, action or error..."
          className="border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
        />

        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
        >
          <option value="">All levels</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="started">started</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading system logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-gray-500">No logs match your filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2 border-b text-xs uppercase tracking-wide text-gray-600">Time</th>
                <th className="px-3 py-2 border-b text-xs uppercase tracking-wide text-gray-600">Action</th>
                <th className="px-3 py-2 border-b text-xs uppercase tracking-wide text-gray-600">Target</th>
                <th className="px-3 py-2 border-b text-xs uppercase tracking-wide text-gray-600">Actor</th>
                <th className="px-3 py-2 border-b text-xs uppercase tracking-wide text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="align-top hover:bg-gray-50">
                  <td className="px-3 py-3 border-b whitespace-nowrap text-gray-600">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-3 py-3 border-b">
                    <div className="font-semibold text-gray-900">{log.action || "-"}</div>
                    <div className={`text-xs ${levelClass(log.level)}`}>{log.level || "info"}</div>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-xs ${statusClass(log.status)}`}>
                      {log.status || "success"}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b">
                    <div className="font-medium text-gray-900">{log.targetLabel || log.targetId || "-"}</div>
                    <div className="text-xs text-gray-500">{log.targetType || "-"}</div>
                    {log.targetId && (
                      <div className="text-[11px] text-gray-400 font-mono break-all">{log.targetId}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 border-b text-gray-700">
                    {log.actorEmail || "-"}
                  </td>
                  <td className="px-3 py-3 border-b min-w-[280px]">
                    {log.error?.message && (
                      <p className="text-sm text-red-700 mb-2">{log.error.message}</p>
                    )}

                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer font-medium text-gray-700">Inspect payload</summary>
                      <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-900 text-gray-100 p-3">
                        {stringify({
                          before: log.before,
                          after: log.after,
                          context: log.context,
                          error: log.error,
                        })}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;
