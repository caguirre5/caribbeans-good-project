// src/pages/account/MyOrders.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import OrdersTab, { Order } from "./OrdersTab";
import ContractsTab from "./ContractsTab";

const toMaybeDate = (v: any): Date | null =>
  (v as Timestamp)?.toDate?.() ?? (v ? new Date(v) : null);

const normalizeIds = (raw: any): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((value) => String(value || "").trim()).filter(Boolean);
};

const chunkValues = <T,>(values: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

type CompanyMemberRole = "owner" | "admin" | "member" | "viewer";

const COMPANY_ORDER_ROLES = new Set<CompanyMemberRole>(["owner", "admin", "member"]);

const canAccessCompanyOrders = (member: any) => {
  const role = String(member?.role || "").toLowerCase() as CompanyMemberRole;
  const status = String(member?.status || "").toLowerCase();
  return status === "active" && COMPANY_ORDER_ROLES.has(role);
};

const fetchOrderableCompanyIdsForUser = async (
  db: ReturnType<typeof getFirestore>,
  uid: string,
  companyIds: string[]
) => {
  const orderableIds = await Promise.all(
    companyIds.map(async (companyId) => {
      try {
        const memberSnap = await getDoc(doc(db, "companies", companyId, "members", uid));
        if (!memberSnap.exists()) return null;
        return canAccessCompanyOrders(memberSnap.data()) ? companyId : null;
      } catch (error) {
        console.error("Error checking company order access:", companyId, error);
        return null;
      }
    })
  );

  return orderableIds.filter(Boolean) as string[];
};

const MyOrders: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "contracts">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    (async () => {
      if (!currentUser) {
        setOrders([]);
        return;
      }

      setLoadingOrders(true);
      try {
        const db = getFirestore();
        const ordersRef = collection(db, "orders");
        const orderDocs = new Map<string, any>();
        const addSnapshot = (snap: Awaited<ReturnType<typeof getDocs>>) => {
          snap.docs.forEach((orderDoc) => {
            orderDocs.set(orderDoc.id, orderDoc.data());
          });
        };

        const ownSnap = await getDocs(
          query(ordersRef, where("createdBy", "==", currentUser.uid))
        );
        addSnapshot(ownSnap);

        try {
          const userSnap = await getDoc(doc(db, "users", currentUser.uid));
          const companyIds = userSnap.exists()
            ? normalizeIds(userSnap.data()?.companyIds)
            : [];
          const orderableCompanyIds = await fetchOrderableCompanyIdsForUser(
            db,
            currentUser.uid,
            companyIds
          );

          await Promise.all(
            chunkValues(orderableCompanyIds, 30).map(async (chunk) => {
              if (chunk.length === 0) return;
              try {
                const companySnap = await getDocs(
                  query(
                    ordersRef,
                    where("companyAccessIds", "array-contains-any", chunk)
                  )
                );
                addSnapshot(companySnap);
              } catch (companyError) {
                console.error("Error fetching company orders:", companyError);
              }
            })
          );
        } catch (companyLookupError) {
          console.error("Error fetching user companies for orders:", companyLookupError);
        }

        const list: Order[] = Array.from(orderDocs.entries()).map(([id, data]) => ({
          id,
          orderNoShort: data.orderNoShort ?? null,
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
        }));

        list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setOrders(list);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [currentUser]);

  return (
    <div>
      <div className="p-4 ">
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
          <ContractsTab />
        )}
      </div>
    </div>
  );
};

export default MyOrders;
