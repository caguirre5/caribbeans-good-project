import React, { useEffect, useMemo, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faClipboard } from '@fortawesome/free-solid-svg-icons';

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
  orderNoShort?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: Date | null;
  status: string;
  totals: { total: number; currency: string; deliveryFee: number; };
  items: OrderItem[];
  deliveryMethod?: 'economy' | 'express' | 'saturday' | string | null;
  address?: string | null;
  notes?: string | null;
  preferredDeliveryDate?: Date | null;
  phone?: string | null;    
  trackingNumber?: string | null;
}


const currencyFmt = (value: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);

function friendlyStatus(o: Order) {
  if (o.status !== "handoff") return o.status;
  const isPickup = o.deliveryMethod === "pickup";
  return isPickup ? "Ready for pickup" : "On the way";
}

function prettyStatus(status?: string | null, deliveryMethod?: string | null): string {
  const st = (status ?? "").toLowerCase().trim();
  if (st !== "handoff") return status ?? "";

  const mode = (deliveryMethod ?? "").toLowerCase().trim();
  return mode === "pickup" ? "Ready for pickup" : "On the way";
}


const labelForEmail = (o: Order, st: string) => {
  if (st !== "handoff") return st;
  return (o.deliveryMethod === "pickup") ? "Ready for pickup" : "On the way";
};

const statusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-300",
  processing: "bg-green-100 text-green-700 border-green-300",
  handoff: "bg-indigo-100 text-indigo-700 border-indigo-300",
  completed: "bg-gray-100 text-gray-700 border-gray-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const toMaybeDate = (v: any): Date | null =>
  v?.toDate?.() ?? (v ? new Date(v) : null);

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

  // ── estados de filtros / orden / búsqueda ───────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "processing" | "handoff" | "completed" | "cancelled">("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "total_desc" | "total_asc">("date_desc");
  
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [copied, setCopied] = useState(false);

  // Modal de cambio de status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusToApply, setStatusToApply] = useState<"" | "pending" | "processing" | "handoff" | "completed" | "cancelled">("");
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const searchDebounced = useDebounced(search, 250);

  const [trackingNumber, setTrackingNumber] = useState("");

  const isOnTheWayChange =
  statusToApply === "handoff" &&
  (selectedOrder?.deliveryMethod ?? "").toLowerCase().trim() !== "pickup";


const buildOrderStatusEmailHTML = (orderLabel: string, newStatus: string, tracking?: string) => `
<html>
  <body style="margin:0;padding:0;background:#f6f8fa;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fa;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #eaecef;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
            <tr>
              <td style="padding:20px 24px 12px;">
                <h1 style="margin:0;font-size:18px;line-height:1.3;color:#111;">Your order status has changed</h1>
                <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">
                  We wanted to let you know your order <b>#${orderLabel}</b> has been updated.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px;">
                <div style="height:1px;background:#eaecef;"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 4px;">
                <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">
                  <b>New status:</b>
                  <span style="
                    display:inline-block;
                    margin-left:6px;
                    padding:2px 8px;
                    font-size:12px;
                    line-height:1.6;
                    border:1px solid #dfe2e6;
                    border-radius:999px;
                    text-transform:capitalize;
                    background:#f3f4f6;
                    color:#111;
                  ">
                    ${newStatus}
                  </span>
                </p>

                ${
                  tracking
                    ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">
                        <b>Tracking number:</b> <span style="font-family:monospace;">${tracking}</span>
                      </p>`
                    : ``
                }
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 16px;">
                <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#444;">
                  You can review your order any time in <b>My Orders</b>.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
                  If you have any questions, simply reply to this email and our team will get back to you.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px 20px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">
                  — Caribbean Goods Team
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a8f98;font-family:Arial,Helvetica,sans-serif;">
            This message was sent regarding order #${orderLabel}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  

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
          orderNoShort: data.orderNoShort ?? null, // ← LEEMOS EL NUEVO CAMPO
          customerName: data.customerName ?? null,
          customerEmail: data.customerEmail ?? null,
          createdAt: data.createdAt?.toDate?.() ?? null,
          status: data.status ?? "pending",
          totals: {
            total: data.totals?.total ?? 0,
            currency: data.totals?.currency ?? "GBP",
            deliveryFee: data.totals?.deliveryFee ?? 0, 
          },
          items: data.items ?? [],
          deliveryMethod: data.deliveryMethod ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
          preferredDeliveryDate: toMaybeDate(data.preferredDeliveryDate),
          phone: data.phone ?? null, 
        });
      });
      setOrders(loaded);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showEmailModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showEmailModal]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch {
      console.error("Could not copy. Select manually.");
    }
  };

  const formatFullDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // calcula peso total
  const computeTotalKg = (o: Order) =>
    (o.items || []).reduce((acc, it) => {
      if (typeof it.lineKg === "number") return acc + it.lineKg;
      if (typeof it.bags === "number") {
        const bagKg = typeof it.bagKg === "number" ? it.bagKg : 24;
        return acc + it.bags * bagKg;
      }
      return acc;
    }, 0);

  // crea cuerpo de email
  const buildCarrierEmail = (o: Order) => {
    const totalKg = Math.max(0, Math.round(computeTotalKg(o)));
    const service = (o.deliveryMethod?.toString().toUpperCase() || "ECONOMY") + " SERVICE";
    const deliveryText = o.preferredDeliveryDate ? formatFullDate(o.preferredDeliveryDate) : "";
    const timingLine = deliveryText
      ? `Can it be picked up — and delivered (${deliveryText})?\n`
      : `Can it be picked up — and delivered — ?\n`;
    const toAddress = o.address ?? "";
    const fromAddress = "";
    const contact = o.customerName
      ? `${o.customerName}${o.customerEmail ? ` (${o.customerEmail})` : ""}`
      : (o.customerEmail || "");
    const phone = o.phone || "";


    return (
      `Dear WArmstrong,
      
      I would like to coordinate a new pallet delivery.
      ${timingLine}${service}
      Weight ${totalKg} kg
      
      From: ${fromAddress}
      To: ${toAddress}
      Contact: ${contact}${phone ? ` — Phone: ${phone}` : ""}
      
      Thank you,`
      ).trim();
      
  };

  // abrir modal y preparar texto
  const openEmailModal = (o: Order) => {
    setEmailBody(buildCarrierEmail(o));
    setShowEmailModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedOrder || !statusToApply) return;
    const orderId = selectedOrder.id;
    const orderLabel = selectedOrder.orderNoShort || selectedOrder.id;
    const recipientEmail = selectedOrder.customerEmail || "";

  
    try {
      setStatusSubmitting(true);
  
      // 1) Actualizar estado en backend (ya tienes updateStatus)
      await updateStatus(
        orderId,
        statusToApply,
        isOnTheWayChange ? { trackingNumber: trackingNumber.trim() } : undefined
      );

  
      // 2) Enviar correo al cliente (si hay email)
      if (recipientEmail) {
        try {
          const auth = getAuth();
          const token = await auth.currentUser?.getIdToken();
          const newStatusLabel = labelForEmail(selectedOrder, statusToApply);
          const trackingToSend = isOnTheWayChange ? trackingNumber.trim() : "";
          const subject = `Your order status is now ${newStatusLabel}`;
          const html = buildOrderStatusEmailHTML(
            orderLabel,
            newStatusLabel,
            trackingToSend || undefined
          );


          const res = await fetch(
            `${import.meta.env.VITE_FULL_ENDPOINT}/email/sendCustomEmail`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                recipientEmail,
                subject,
                html,
              }),
            }
          );
  
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            console.error("Email send failed:", t);
          }
        } catch (e) {
          console.error("Email send error:", e);
        }
      }
    } catch (e) {
      console.error(e);
      alert("There was a problem updating the status.");
    } finally {
      setStatusSubmitting(false);
      setStatusModalOpen(false);
      setStatusToApply("");
      setStatusConfirm(false);
    }
  };
  

  const updateStatus = async (orderId: string, newStatus: string, extra?: { trackingNumber?: string }) => {
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
          body: JSON.stringify({ status: newStatus, ...(extra ?? {}) }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: data.newStatus, ...(isOnTheWayChange ? { trackingNumber: trackingNumber.trim() } : {}) }
            : o
        )

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

  // ── lista filtrada + ordenada ───────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    const term = searchDebounced.trim().toLowerCase();
    let list = orders;

    if (term) {
      list = list.filter((o) => {
        const name = (o.customerName || "").toLowerCase();
        const email = (o.customerEmail || "").toLowerCase();
        const id = o.id.toLowerCase();
        const shortNo = (o.orderNoShort || "").toLowerCase(); // ← incluir en búsqueda
        return (
          name.includes(term) ||
          email.includes(term) ||
          id.includes(term) ||
          shortNo.includes(term)
        );
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

// ==========================
// RETURN: DETAIL (selectedOrder)
// ==========================
if (selectedOrder) {
  const o = selectedOrder;
  const orderLabel = o.orderNoShort || o.id;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Order #{orderLabel}</h2>
          <p className="text-sm text-gray-500">
            Review items, fulfilment details and update status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(null)}
            className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-100"
            title="Back to orders"
          >
            ← Back
          </button>

          <button
            onClick={() => openEmailModal(o)}
            className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]"
            title="Generate email template"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            Generate
          </button>
        </div>
      </div>

      {/* Top row: Status + Update */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wide ${
              statusColors[o.status] || "bg-gray-100 text-gray-700 border-gray-300"
            }`}
          >
            {friendlyStatus(o)}
          </span>
          {o.deliveryMethod && (
            <span className="text-xs text-gray-500">
              · <span className="capitalize">{o.deliveryMethod}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Update status</span>
          <select
            value={o.status}
            disabled={updating}
            onChange={(e) => {
              setStatusToApply(e.target.value as any);
              setStatusConfirm(false);
              setTrackingNumber("");
              setStatusModalOpen(true);
            }}
            className="border border-gray-300 px-2 py-1 rounded-md text-sm bg-white"
            title="Update status"
          >
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="handoff">{prettyStatus("handoff", o.deliveryMethod)}</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
      </div>

      {/* Meta blocks */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Customer</p>
          <p className="text-sm text-gray-900 font-semibold">
            {o.customerName || "(No name)"}
          </p>
          {o.customerEmail ? (
            <a className="text-sm text-blue-600 underline" href={`mailto:${o.customerEmail}`}>
              {o.customerEmail}
            </a>
          ) : (
            <p className="text-sm text-gray-500">—</p>
          )}
          {o.phone && (
            <p className="text-sm text-gray-700 mt-1">
              Phone: <span className="font-medium">{o.phone}</span>
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Meta</p>
          <p className="text-sm text-gray-700">
            Created: {o.createdAt ? o.createdAt.toLocaleString() : "—"}
          </p>
          <p className="text-sm text-gray-700 break-all">
            ID: <span className="font-mono">{o.id}</span>
          </p>
        </div>
      </div>

      {/* Fulfilment / Address */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Fulfilment</p>
          <p className="text-sm text-gray-800">
            Method:{" "}
            <span className="font-medium capitalize">
              {o.deliveryMethod ? o.deliveryMethod : "—"}
            </span>
          </p>
          <p className="text-sm text-gray-800">
            Preferred date:{" "}
            <span className="font-medium">
              {o.preferredDeliveryDate ? o.preferredDeliveryDate.toLocaleString() : "—"}
            </span>
          </p>
          {o.trackingNumber && (
            <p className="text-sm text-gray-800">
              Tracking: <span className="font-mono">{o.trackingNumber}</span>
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Address & Notes</p>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className={`text-sm ${o.address ? "text-gray-800" : "text-gray-500"}`}>
              <span className="font-medium">Address:</span>{" "}
              {o.address ? <span className="break-words">{o.address}</span> : "—"}
            </p>

            <p className={`text-sm mt-2 ${o.notes ? "text-gray-800" : "text-gray-500"}`}>
              <span className="font-medium">Notes:</span>{" "}
              {o.notes ? (
                <span className="whitespace-pre-wrap break-words">{o.notes}</span>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Items</span>
          <span className="text-xs text-gray-500">
            {o.items?.length ? `${o.items.length} item(s)` : "0 items"}
          </span>
        </div>

        {o.items?.length ? (
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b">
                    Variety
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b text-right">
                    Bags
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b text-right">
                    Bag (kg)
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b text-right">
                    Line kg
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b text-right">
                    Unit / kg
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((it, i) => (
                  <tr key={i} className="hover:bg-gray-50">
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
                        ? currencyFmt(it.unitPricePerKg, o.totals.currency)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 border-b text-right">
                      {typeof it.lineSubtotal === "number"
                        ? currencyFmt(it.lineSubtotal, o.totals.currency)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No items.</p>
        )}

        {/* Totals (same vibe as CompanyManager blocks) */}
        <div className="mt-4 flex justify-end">
          <div className="w-full md:w-auto md:min-w-[280px] rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Delivery fee</span>
              <span className="font-medium">
                {currencyFmt(o.totals?.deliveryFee ?? 0, o.totals?.currency ?? "GBP")}
              </span>
            </div>
            <div className="border-t my-3" />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                {currencyFmt(o.totals?.total ?? 0, o.totals?.currency ?? "GBP")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Email Template (CompanyManager style) */}
      {showEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Email Template</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 inline-flex items-center justify-center"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Generated message to send to your carrier. Edit as needed, then copy.
            </p>

            <textarea
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white leading-6 min-h-[260px]"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">
                Tip: If pickup only, the timing line can be blank.
              </div>

              <button
                onClick={handleCopy}
                disabled={copied}
                className={[
                  "h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border",
                  copied
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]",
                ].join(" ")}
              >
                {copied ? (
                  "Copied"
                ) : (
                  <>
                    <FontAwesomeIcon icon={faClipboard} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm status change (CompanyManager style) */}
      {statusModalOpen && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-2">Confirm status update</h2>

            <p className="text-sm text-gray-600 mb-4">
              You’re about to change the status of order{" "}
              <b>#{selectedOrder.orderNoShort || selectedOrder.id}</b>.
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span className="capitalize px-2 py-1 rounded-full border text-xs">
                {friendlyStatus(selectedOrder)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="capitalize px-2 py-1 rounded-full border text-xs">
                {prettyStatus(statusToApply, selectedOrder.deliveryMethod) || "—"}
              </span>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
              A notification email will be sent to{" "}
              <b>{selectedOrder.customerEmail || "(no email on file)"}</b>.
            </p>

            <label className="flex items-start gap-2 text-sm mb-3">
              <input
                type="checkbox"
                checked={statusConfirm}
                onChange={(e) => setStatusConfirm(e.target.checked)}
                className="h-4 w-4"
              />
              <span>I understand and want to proceed.</span>
            </label>

            {isOnTheWayChange && (
              <div className="space-y-1 mb-3">
                <label className="text-xs font-semibold text-gray-700">
                  Tracking number (required for “On the way”)
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. WAX123456789GB"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
                />
                <p className="text-xs text-gray-500">
                  This will be included in the email sent to the customer.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                disabled={statusSubmitting}
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusToApply("");
                  setStatusConfirm(false);
                }}
              >
                Cancel
              </button>

              <button
                className={[
                  "px-4 py-2 rounded text-sm text-white",
                  statusSubmitting ||
                  !statusConfirm ||
                  (isOnTheWayChange && !trackingNumber.trim())
                    ? "bg-[#174B3D] opacity-70 cursor-not-allowed"
                    : "bg-[#174B3D] hover:bg-[#0f3a2d]",
                ].join(" ")}
                disabled={
                  !statusConfirm ||
                  statusSubmitting ||
                  (isOnTheWayChange && !trackingNumber.trim())
                }
                onClick={confirmStatusChange}
              >
                {statusSubmitting ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================
// RETURN: LIST (no selectedOrder)
// ==========================
return (
  <div className="bg-white p-4 rounded-lg shadow-md">
    {/* Header */}
    <div className="flex items-center justify-between gap-3 mb-4 border-b pb-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Orders</h2>
        <p className="text-sm text-gray-500">
          Search, filter and open an order to manage fulfilment.
        </p>
      </div>

      <button
        onClick={() => {
          setSearch("");
          setStatusFilter("");
          setSortBy("date_desc");
        }}
        className="text-gray-500 hover:text-gray-700"
        title="Reset filters"
      >
        <span className="text-sm font-semibold">Reset</span>
      </button>
    </div>

    {/* Controls */}
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        {/* search */}
        <input
          type="text"
          placeholder="Search name, email or order no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-2 py-1 rounded-md text-sm w-full md:w-80 bg-white"
        />

        {/* status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-gray-300 px-2 py-1 rounded-md text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="handoff">handoff</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>

        {/* sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-gray-300 px-2 py-1 rounded-md text-sm bg-white"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="total_desc">Total: high → low</option>
          <option value="total_asc">Total: low → high</option>
        </select>
      </div>

      <div className="text-xs text-gray-500">
        {filteredAndSorted.length} order(s)
      </div>
    </div>

    {/* List */}
    {filteredAndSorted.length === 0 ? (
      <p className="text-sm text-gray-500 italic">No orders match your filters.</p>
    ) : (
      <div className="divide-y divide-gray-100">
        {filteredAndSorted.map((o) => {
          const orderLabel = o.orderNoShort || o.id;
          return (
            <button
              key={o.id}
              type="button"
              className="w-full text-left py-3"
              onClick={() => setSelectedOrder(o)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      Order #{orderLabel}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        statusColors[o.status] || "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {friendlyStatus(o)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 truncate mt-0.5">
                    {o.customerName || "(No name)"} — {o.customerEmail || ""}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {o.createdAt ? o.createdAt.toLocaleString() : "No date"}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {currencyFmt(o.totals.total, o.totals.currency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Fee: {currencyFmt(o.totals?.deliveryFee ?? 0, o.totals?.currency ?? "GBP")}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

};

export default OrdersList;
