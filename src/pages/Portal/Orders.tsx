// src/pages/account/MyOrders.tsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, getFirestore, query, where, Timestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";
import OrdersTab, { Order } from "./OrdersTab";
import ContractsTab, { Contract } from "./ContractsTab";

const toMaybeDate = (v: any): Date | null =>
  (v as Timestamp)?.toDate?.() ?? (v ? new Date(v) : null);

const MyOrders: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "contracts">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);

  useEffect(() => {
    (async () => {
      if (!currentUser) return;

      // ── ORDERS ─────────────────────────────────────────────────────────
      setLoadingOrders(true);
      try {
        const db = getFirestore();
        const q = query(collection(db, "orders"), where("createdBy", "==", currentUser.uid));
        const snap = await getDocs(q);

        const list: Order[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id, // interno — NO se muestra
            orderNoShort: data.orderNoShort ?? null, // << número correlativo que SÍ se muestra
            customerName: data.customerName ?? null,
            customerEmail: data.customerEmail ?? null,
            createdAt: toMaybeDate(data.createdAt),
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
          };
        });

        list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setOrders(list);
      } finally {
        setLoadingOrders(false);
      }

      // ── CONTRACTS ──────────────────────────────────────────────────────
      // El admin los crea y los relaciona por email => consultamos por email del usuario
      if (!currentUser.email) return;

      setLoadingContracts(true);
      try {
        const db = getFirestore();
        // normaliza a minúsculas por si acaso
        const email = currentUser.email.toLowerCase();
        const cq = query(collection(db, "contracts"), where("email", "==", email));
        const csnap = await getDocs(cq);

        const clist: Contract[] = csnap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            name: data.name ?? "",
            email: data.email ?? "",
            s3Url: data.s3Url ?? "",
            fileKey: data.fileKey ?? "",
            status: data.status ?? "pending",
            createdAt: toMaybeDate(data.createdAt),
            updatedAt: toMaybeDate(data.updatedAt),
          };
        });

        clist.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setContracts(clist);
      } finally {
        setLoadingContracts(false);
      }
    })();
  }, [currentUser]);

  return (
    <div>
      <Header />

      <div className="p-4 my-20 mx-4 pb-20 lg:mx-40">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === "orders"
                ? "border-emerald-700 text-emerald-800 font-semibold"
                : "border-transparent text-gray-600"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === "contracts"
                ? "border-emerald-700 text-emerald-800 font-semibold"
                : "border-transparent text-gray-600"
            }`}
            onClick={() => setActiveTab("contracts")}
          >
            Contracts
          </button>
        </div>

        {activeTab === "orders" && (
          <OrdersTab orders={orders} loading={loadingOrders} />
        )}

        {activeTab === "contracts" && (
          <ContractsTab contracts={contracts} loading={loadingContracts} />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyOrders;
