import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore, query, where, Timestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";

type OrderItem = {
  varietyName?: string;
  bags?: number;
  unitPricePerKg?: number;
  lineSubtotal?: number;
};

type Order = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: Date | null;
  status: "pending" | "processing" | "completed" | "cancelled" | string;
  totals: { total: number; currency: string };
  items: OrderItem[];
};

const currencyFmt = (v: number, c: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(v);

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-300",
  processing: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const MyOrders: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "contracts">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "processing" | "completed" | "cancelled">("");

  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const db = getFirestore();
        // Solo órdenes del usuario autenticado (sin orderBy para evitar índice)
        const q = query(collection(db, "orders"), where("createdBy", "==", currentUser.uid));
        const snap = await getDocs(q);

        const list: Order[] = snap.docs.map((d) => {
          const data: any = d.data();
          const ts: Timestamp | undefined = data.createdAt;
          return {
            id: d.id,
            customerName: data.customerName ?? null,
            customerEmail: data.customerEmail ?? null,
            createdAt: ts?.toDate?.() ?? null,
            status: data.status ?? "pending",
            totals: {
              total: data.totals?.total ?? 0,
              currency: data.totals?.currency ?? "GBP",
            },
            items: data.items ?? [],
          };
        });

        // Ordena en el cliente por fecha desc
        list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setOrders(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const filtered = useMemo(() => {
    return orders.filter((o) => (statusFilter ? o.status === statusFilter : true));
  }, [orders, statusFilter]);

  return (
    <div>
      <Header />

      <div className="p-4 my-20 mx-4 pb-20 lg:mx-40" style={{ height: "calc(100vh - 10rem)" }}>
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === "orders" ? "border-emerald-700 text-emerald-800 font-semibold" : "border-transparent text-gray-600"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === "contracts" ? "border-emerald-700 text-emerald-800 font-semibold" : "border-transparent text-gray-600"
            }`}
            onClick={() => setActiveTab("contracts")}
          >
            Contracts (coming soon)
          </button>
        </div>

        {activeTab === "orders" && (
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

            {/* Lista de órdenes */}
            <div className="bg-white border rounded-lg">
              {loading ? (
                <div className="p-6 text-gray-600">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-gray-600">No orders found.</div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((o) => (
                    <li key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-semibold">Order #{o.id}</div>
                        <div className="text-sm text-gray-600">
                          {o.customerName || "(No name)"} — {o.customerEmail || ""}
                        </div>
                        <div className="text-sm text-gray-600">
                          {o.createdAt ? o.createdAt.toLocaleString() : "No date"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-sm ${
                            statusColors[o.status] || "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {o.status}
                        </span>
                        <div className="font-semibold">
                          {currencyFmt(o.totals.total, o.totals.currency)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {activeTab === "contracts" && (
          <div className="p-6 bg-gray-50 border rounded-lg text-gray-700">
            <p>
              Contracts area is <b>coming soon</b>. You’ll be able to see your reservation agreements here.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyOrders;
