// src/pages/account/ContractsTab.tsx
import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export interface Contract {
  id: string;
  name: string;
  email: string;
  s3Url: string;
  fileKey: string;
  status: "pending" | "processing" | "completed" | "cancelled" | string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-300",
  processing: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const ContractsTab: React.FC<{ contracts: Contract[]; loading: boolean }> = ({
  contracts,
  loading,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "processing" | "completed" | "cancelled"
  >("");

  const filtered = useMemo(
    () => contracts.filter((c) => (statusFilter ? c.status === statusFilter : true)),
    [contracts, statusFilter]
  );

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
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border rounded-lg">
        {loading ? (
          <div className="p-6 text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-600">No contracts found.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                {/* Left section */}
                <div>
                  <div className="font-semibold text-gray-800">
                    Contract #{c.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    {c.name || "(No name)"} — {c.email || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {c.createdAt ? c.createdAt.toLocaleString() : "No date"}
                  </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">
                  {c.s3Url && (
                    <a
                      href={c.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faDownload} className="text-white" />
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
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ContractsTab;
