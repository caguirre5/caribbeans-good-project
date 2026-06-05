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
  userGroups?: string[];
};

type InventoryQuery = {
  label: string;
  run: () => Promise<QueryDocumentSnapshot<DocumentData>[]>;
};

const normalizeGroupName = (group: unknown) => String(group ?? "").trim();

const uniqueGroups = (groups: string[] = []) =>
  Array.from(new Set(groups.map(normalizeGroupName).filter(Boolean)));

const chunksOf = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

export const fetchReadableInventoryDocs = async (
  db: Firestore,
  { isAdmin = false, userGroups = [] }: InventoryVisibilityOptions = {}
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

  for (const groupChunk of chunksOf(uniqueGroups(userGroups), 30)) {
    visibleQueries.push({
      label: `group inventory query (${groupChunk.join(", ")})`,
      run: async () => {
        const snap = await getDocs(
          query(
            inventoryRef,
            where("isActive", "==", true),
            where("groupNames", "array-contains-any", groupChunk)
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
