import React, { useEffect, useMemo, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

interface OrderItem {
  bagKg?: number;
  bags?: number;
  lineKg?: number;
  unitPricePerKg?: number;
  lineSubtotal?: number;
  varietyName?: string;
  [k: string]: any;
}

interface Order {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: Date | null;
  status: string;
  totals: { total: number; currency: string };
  items: OrderItem[];
}

const currencyFmt = (value: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-300",
  processing: "bg-green-100 text-green-700 border-green-300",
  completed: "bg-gray-100 text-gray-700 border-gray-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

// pequeño hook para debounce de búsqueda
function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  // ── NUEVO: estados de filtros / orden / búsqueda ───────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "processing" | "completed" | "cancelled">("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "total_desc" | "total_asc">("date_desc");
  const searchDebounced = useDebounced(search, 250);

  useEffect(() => {
    const fetchOrders = async () => {
      const db = getFirestore();
      const ordersRef = collection(db, "orders");
      const snap = await getDocs(ordersRef);
      const loaded: Order[] = [];
      snap.forEach((docSnap) => {
        if (!docSnap.exists()) return;
        const data: any = docSnap.data();
        loaded.push({
          id: docSnap.id,
          customerName: data.customerName ?? null,
          customerEmail: data.customerEmail ?? null,
          createdAt: data.createdAt?.toDate?.() ?? null,
          status: data.status ?? "pending",
          totals: {
            total: data.totals?.total ?? 0,
            currency: data.totals?.currency ?? "GBP",
          },
          items: data.items ?? [],
        });
      });
      setOrders(loaded);
    };
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/orders/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: data.newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: data.newStatus });
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  // ── NUEVO: lista filtrada + ordenada ───────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    const term = searchDebounced.trim().toLowerCase();
    let list = orders;

    if (term) {
      list = list.filter((o) => {
        const name = (o.customerName || "").toLowerCase();
        const email = (o.customerEmail || "").toLowerCase();
        const id = o.id.toLowerCase();
        return name.includes(term) || email.includes(term) || id.includes(term);
      });
    }

    if (statusFilter) {
      list = list.filter((o) => o.status === statusFilter);
    }

    const byDate = (o: Order) => (o.createdAt ? o.createdAt.getTime() : 0);
    const byTotal = (o: Order) => o.totals.total ?? 0;

    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return byDate(a) - byDate(b);
        case "total_desc":
          return byTotal(b) - byTotal(a);
        case "total_asc":
          return byTotal(a) - byTotal(b);
        case "date_desc":
        default:
          return byDate(b) - byDate(a);
      }
    });

    return sorted;
  }, [orders, searchDebounced, statusFilter, sortBy]);

  // ───────────────────────────────────────────────────────────────────────────────

  if (selectedOrder) {
    const o = selectedOrder;
    return (
      <div className="bg-white p-4 rounded shadow">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-4 text-sm px-3 py-1 rounded border hover:bg-gray-50"
        >
          ← Back to orders
        </button>

        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold">Order #{o.id}</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              statusColors[o.status] || "bg-gray-100 text-gray-700 border-gray-300"
            }`}
          >
            {o.status}
          </span>
        </div>

        <div className="mb-4">
          <label className="text-sm mr-2">Update status:</label>
          <select
            value={o.status}
            disabled={updating}
            onChange={(e) => updateStatus(o.id, e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="font-semibold">Customer</p>
            <p>{o.customerName || "(No name)"}</p>
            {o.customerEmail && (
              <a className="text-sm text-blue-600 underline" href={`mailto:${o.customerEmail}`}>
                {o.customerEmail}
              </a>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Meta</p>
            <p>Created: {o.createdAt ? o.createdAt.toLocaleString() : "No date"}</p>
            <p className="font-semibold">Total: {currencyFmt(o.totals.total, o.totals.currency)}</p>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-2">Items</p>
          {o.items?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 border">Variety</th>
                    <th className="text-right p-2 border">Bags</th>
                    <th className="text-right p-2 border">Bag (kg)</th>
                    <th className="text-right p-2 border">Line kg</th>
                    <th className="text-right p-2 border">Unit / kg</th>
                    <th className="text-right p-2 border">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{it.varietyName ?? "—"}</td>
                      <td className="p-2 border text-right">{typeof it.bags === "number" ? it.bags : "—"}</td>
                      <td className="p-2 border text-right">{typeof it.bagKg === "number" ? it.bagKg : "—"}</td>
                      <td className="p-2 border text-right">{typeof it.lineKg === "number" ? it.lineKg : "—"}</td>
                      <td className="p-2 border text-right">
                        {typeof it.unitPricePerKg === "number" ? currencyFmt(it.unitPricePerKg, o.totals.currency) : "—"}
                      </td>
                      <td className="p-2 border text-right">
                        {typeof it.lineSubtotal === "number" ? currencyFmt(it.lineSubtotal, o.totals.currency) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No items.</p>
          )}
        </div>
      </div>
    );
  }

  // ── LISTA + BARRA DE CONTROLES ──────────────────────────────────────────────────
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Orders</h2>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* search */}
          <div className="relative md:w-64">
            <input
              type="text"
              placeholder="Search name, email or id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 pr-8 text-sm"
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="total_desc">Total: high → low</option>
            <option value="total_asc">Total: low → high</option>
          </select>

          {/* clear filters */}
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setSortBy("date_desc");
            }}
            className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* listado */}
      {filteredAndSorted.length === 0 ? (
        <p className="text-gray-600">No orders match your filters.</p>
      ) : (
        <ul className="space-y-3">
          {filteredAndSorted.map((o) => (
            <li
              key={o.id}
              className="border p-3 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedOrder(o)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setSelectedOrder(o) : null)}
            >
              <p className="font-semibold mb-1">
                {o.customerName || "(No name)"} — {o.customerEmail || ""}
              </p>
              <p className="text-sm text-gray-500">
                {o.createdAt ? o.createdAt.toLocaleString() : "No date"} • Status:{" "}
                <span
                  className={`px-2 py-0.5 rounded-full border ${
                    statusColors[o.status] || "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {o.status}
                </span>
              </p>
              <p className="font-bold">{currencyFmt(o.totals.total, o.totals.currency)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersList;
