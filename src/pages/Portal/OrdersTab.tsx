// src/pages/account/OrdersTab.tsx
import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

type OrderItem = {
  varietyName?: string;
  bags?: number;
  unitPricePerKg?: number;
  lineSubtotal?: number;
  bagKg?: number;
  lineKg?: number;
};

export type Order = {
  id: string;
  orderNoShort?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  createdAt: Date | null;     // ✅ Date
  status: string;
  totals: { total: number; currency: string; deliveryFee: number };
  items: any[];
  deliveryMethod?: any;
  address?: any;
  notes?: string | null;
  preferredDeliveryDate?: Date | null; // ✅ Date
};


const currencyFmt = (v: number, c: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(v);

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-300",
  processing: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

// ──────────────────────────────────────────────────────────────
// Cálculo de totales (idéntico a OrdersList)
// ──────────────────────────────────────────────────────────────
const BAG_KG_DEFAULT = 24 as const;
const DELIVERY_COSTS = { economy: 75, express: 95, saturday: 100 } as const;

function n(v: any): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function computeItemsSubtotal(items: OrderItem[]) {
  return (items || []).reduce((acc, it) => {
    const line =
      typeof it.lineSubtotal === "number"
        ? it.lineSubtotal
        : n(it.bags) *
          (typeof it.bagKg === "number" ? it.bagKg : BAG_KG_DEFAULT) *
          n(it.unitPricePerKg);
    return acc + line;
  }, 0);
}

function computeTotalBags(items: OrderItem[]) {
  return (items || []).reduce((acc, it) => acc + n(it.bags), 0);
}

function computeDeliveryFee(
  deliveryMethod: Order["deliveryMethod"],
  subtotal: number,
  totalBags: number
) {
  // mismas reglas: pickup = 0, o 0 si subtotal >= 300 o totalBags >= 15
  if (deliveryMethod === "pickup") return 0;
  if (subtotal >= 300 || totalBags >= 15) return 0;
  const key = (deliveryMethod || "economy") as keyof typeof DELIVERY_COSTS;
  return DELIVERY_COSTS[key] ?? DELIVERY_COSTS.economy;
}

function computeTotalsForOrder(o: Order) {
  const currency = o.totals?.currency || "GBP";
  const subtotal = computeItemsSubtotal(o.items);
  const totalBags = computeTotalBags(o.items);
  const deliveryFee = computeDeliveryFee(o.deliveryMethod, subtotal, totalBags);
  const total = subtotal + deliveryFee;
  return { currency, subtotal, deliveryFee, total };
}

// ──────────────────────────────────────────────────────────────

interface OrdersTabProps {
  orders: Order[];
  loading: boolean;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, loading }) => {
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "processing" | "completed" | "cancelled"
  >("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(
    () => orders.filter((o) => (statusFilter ? o.status === statusFilter : true)),
    [orders, statusFilter]
  );

  // ──────────────────────────────────────────────────────────────
  // DETALLE
  // ──────────────────────────────────────────────────────────────
  if (selectedOrder) {
    const o = selectedOrder;
    const orderLabel = o.orderNoShort || o.id; // SIEMPRE mostrar número legible si existe
    const totals = computeTotalsForOrder(o);

    return (
      <div className="bg-white p-5 rounded-lg shadow text-[#111]">
        {/* Back button */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => setSelectedOrder(null)}
            className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded border hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to orders
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Order #{orderLabel}</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wide ${
              statusColors[o.status] || "bg-gray-100 text-gray-700 border-gray-300"
            }`}
          >
            {o.status}
          </span>
        </div>

        {/* Meta */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Customer</p>
            <p className="text-base font-medium">{o.customerName || "(No name)"}</p>
            {o.customerEmail && (
              <a className="text-sm text-blue-600 underline" href={`mailto:${o.customerEmail}`}>
                {o.customerEmail}
              </a>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Order Info</p>
            <p className="text-sm text-gray-700">
              Created: {o.createdAt ? o.createdAt.toLocaleString() : "No date"}
            </p>
          </div>
        </div>

        {/* Fulfilment */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Fulfilment</p>
            <p className="text-sm">
              Method: <span className="font-medium capitalize">{o.deliveryMethod || "—"}</span>
            </p>
            <p className="text-sm">
              Preferred date:{" "}
              <span className="font-medium">
                {o.preferredDeliveryDate ? o.preferredDeliveryDate.toLocaleString() : "—"}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Address & Notes</p>
            <p className="text-sm">
              <span className="font-medium">Address:</span> {o.address || "—"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Notes:</span> {o.notes || "—"}
            </p>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">Items</p>
          {o.items?.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 border-b">Variety</th>
                    <th className="text-right px-3 py-2 border-b">Bags</th>
                    <th className="text-right px-3 py-2 border-b">Bag (kg)</th>
                    <th className="text-right px-3 py-2 border-b">Line kg</th>
                    <th className="text-right px-3 py-2 border-b">Unit / kg</th>
                    <th className="text-right px-3 py-2 border-b">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((it, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 border-b">{it.varietyName ?? "—"}</td>
                      <td className="px-3 py-2 border-b text-right">
                        {typeof it.bags === "number" ? it.bags : "—"}
                      </td>
                      <td className="px-3 py-2 border-b text-right">
                        {typeof it.bagKg === "number" ? it.bagKg : "—"}
                      </td>
                      <td className="px-3 py-2 border-b text-right">
                        {typeof it.lineKg === "number" ? it.lineKg : "—"}
                      </td>
                      <td className="px-3 py-2 border-b text-right">
                        {typeof it.unitPricePerKg === "number"
                          ? currencyFmt(it.unitPricePerKg, totals.currency)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 border-b text-right">
                        {typeof it.lineSubtotal === "number"
                          ? currencyFmt(it.lineSubtotal, totals.currency)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No items.</p>
          )}

          {/* Totals summary: abajo a la derecha */}
          <div className="mt-4 flex justify-end">
            <div className="w-full md:w-auto md:min-w-[280px] border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Delivery fee</span>
                <span className="font-medium">
                  {currencyFmt(totals.deliveryFee, totals.currency)}
                </span>
              </div>
              <div className="border-t my-2" />
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{currencyFmt(totals.total, totals.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // LISTA
  // ──────────────────────────────────────────────────────────────
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

      {/* Lista de órdenes */}
      <div className="bg-white border rounded-lg">
        {loading ? (
          <div className="p-6 text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-600">No orders found.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map((o) => {
              const orderLabel = o.orderNoShort || o.id; // mostrar correlativo
              const totals = computeTotalsForOrder(o); // usar cálculo consistente
              return (
                <li
                  key={o.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOrder(o)}
                >
                  <div>
                    <div className="font-semibold">Order #{orderLabel}</div>
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
                        statusColors[o.status] ||
                        "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {o.status}
                    </span>
                    <div className="font-semibold">
                      {currencyFmt(totals.total, totals.currency)}
                    </div>
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

export default OrdersTab;
