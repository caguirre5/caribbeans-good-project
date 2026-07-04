import {
  collection,
  getDocs,
  query,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

type InventoryVisibilityOptions = {
  isAdmin?: boolean;
  currentUserId?: string | null;
};

type InventoryQuery = {
  label: string;
  run: () => Promise<QueryDocumentSnapshot<DocumentData>[]>;
};

export const fetchReadableInventoryDocs = async (
  db: Firestore,
  { isAdmin = false, currentUserId = null }: InventoryVisibilityOptions = {}
): Promise<QueryDocumentSnapshot<DocumentData>[]> => {
  const inventoryRef = collection(db, "inventoryItems");

  if (isAdmin) {
    try {
      const snap = await getDocs(inventoryRef);
      return snap.docs;
    } catch (error) {
      console.error("[inventory] admin query failed", error);
      throw error;
    }
  }

  const visibleQueries: InventoryQuery[] = [
    {
      label: "public inventory query",
      run: async () => {
        const snap = await getDocs(
          query(inventoryRef, where("isActive", "==", true), where("groupNames", "==", []))
        );
        return snap.docs;
      },
    },
  ];

  if (currentUserId) {
    visibleQueries.push({
      label: `user inventory query (${currentUserId})`,
      run: async () => {
        const snap = await getDocs(
          query(
            inventoryRef,
            where("isActive", "==", true),
            where("allowedUserIds", "array-contains", currentUserId)
          )
        );
        return snap.docs;
      },
    });
  }

  const docsById = new Map<string, QueryDocumentSnapshot<DocumentData>>();
  const failedQueries: string[] = [];

  for (const visibleQuery of visibleQueries) {
    try {
      const docs = await visibleQuery.run();
      for (const docSnap of docs) docsById.set(docSnap.id, docSnap);
    } catch (error: any) {
      failedQueries.push(`${visibleQuery.label}: ${error?.code || error?.message || "unknown error"}`);
      console.error(`[inventory] ${visibleQuery.label} failed`, error);
    }
  }

  if (failedQueries.length && docsById.size === 0) {
    throw new Error(`Inventory queries failed: ${failedQueries.join(" | ")}`);
  }

  if (failedQueries.length) {
    console.warn("[inventory] Some inventory queries failed, showing partial results", failedQueries);
  }

  return Array.from(docsById.values());
};
