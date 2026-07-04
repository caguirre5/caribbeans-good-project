import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faChevronDown,
  faChevronUp,
  faCodeBranch,
  faPen,
  faPlus,
  faReceipt,
  faRotate,
  faSave,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import { reserveInventoryForSource } from "../../../utils/inventoryStock";
import { writeAuditLog } from "../../../utils/auditLog";

type InventoryView = "stock" | "variety" | "invoice" | "adjust" | "migration";

type GroupDoc = {
  id: string;
  name: string;
};

type InventoryAccessUser = {
  id: string;
  uid: string;
  groups: string[];
};

type InventoryItem = {
  id: string;
  farm: string;
  variety: string;
  harvestYear: string;
  process: string;
  tastingNotes: string;
  bagSizeKg: number;
  pricePerKg: number;
  groupNames: string[];
  allowedUserIds?: string[];
  isActive: boolean;
  availableBags: number;
  availableKg: number;
  reservedBags?: number;
  reservedKg?: number;
  bagBreakdown?: BagBreakdownLine[];
  totalPurchasedBags?: number;
  totalPurchasedKg?: number;
  createdAt?: any;
  updatedAt?: any;
};

type BagBreakdownLine = {
  bagSizeKg: number;
  availableBags: number;
  availableKg: number;
};

type StockLot = {
  id: string;
  inventoryItemId: string;
  label: string;
  bagSizeKg: number;
  initialBags: number;
  availableBags: number;
  initialKg: number;
  availableKg: number;
  sourceType: "invoice" | "manual";
  sourceId: string;
  invoiceNumber?: string;
  supplier?: string;
  reason?: string;
  notes?: string;
  createdAt?: any;
};

type StockEntry = {
  id: string;
  invoiceNumber: string;
  supplier: string;
  invoiceDate: string;
  notes?: string;
  status: "confirmed";
  totalBags: number;
  totalKg: number;
  createdAt?: any;
  items: InvoiceLine[];
};

type MigrationRow = {
  key: string;
  contractId: string;
  contractNo: string;
  customerName: string;
  customerEmail: string;
  selectionIndex: number;
  variety: string;
  remainingBags: number;
  remainingKg: number;
  bagKg: number;
};

type ReservationRepairLine = {
  key: string;
  inventoryItemId: string | null;
  label: string;
  selectionIndex: number;
  bagKg: number;
  requiredBags: number;
  requiredKg: number;
  reservedBags: number;
  missingBags: number;
  missingKg: number;
};

type ReservationRepairRow = {
  contractId: string;
  contractNo: string;
  customerName: string;
  customerEmail: string;
  requiredBags: number;
  reservedBags: number;
  missingBags: number;
  missingKg: number;
  hasMissingInventoryIds: boolean;
  hasSurplusReservation: boolean;
  lines: ReservationRepairLine[];
};

type InvoiceLine = {
  inventoryItemId: string;
  label: string;
  bags: number;
  bagSizeKg: number;
  costPerKg: number;
  totalKg: number;
};

type ItemForm = {
  id?: string;
  farm: string;
  variety: string;
  harvestYear: string;
  process: string;
  tastingNotes: string;
  bagSizeKg: string;
  pricePerKg: string;
  groupNames: string[];
  isActive: boolean;
};

const emptyItemForm: ItemForm = {
  farm: "",
  variety: "",
  harvestYear: "",
  process: "",
  tastingNotes: "",
  bagSizeKg: "24",
  pricePerKg: "",
  groupNames: [],
  isActive: true,
};

const toNum = (value: string | number, fallback = 0) => {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

const toOptionalNum = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const normalizeGroupValue = (value: unknown) => String(value ?? "").trim().toLowerCase();

const normalizeGroupList = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((group) => {
      if (typeof group === "string") return group.trim();
      if (group && typeof group === "object") {
        const data = group as Record<string, unknown>;
        return String(data.name ?? data.id ?? data.value ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
};

const allowedUsersForGroups = (users: InventoryAccessUser[], groupNames: string[]) => {
  const normalizedGroups = new Set(groupNames.map(normalizeGroupValue).filter(Boolean));
  if (!normalizedGroups.size) return [];

  return users
    .filter((user) =>
      user.groups.some((groupName) => normalizedGroups.has(normalizeGroupValue(groupName)))
    )
    .map((user) => user.uid);
};

const sortedUnique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

const sameStringList = (a: string[] = [], b: string[] = []) => {
  const aa = sortedUnique(a);
  const bb = sortedUnique(b);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
};

const applyBagDelta = (
  currentBreakdown: BagBreakdownLine[] | undefined,
  bagSizeKg: number,
  bagDelta: number
) => {
  const map = new Map<number, BagBreakdownLine>();

  (currentBreakdown || []).forEach((line) => {
    const size = toNum(line.bagSizeKg);
    if (!size) return;
    map.set(size, {
      bagSizeKg: size,
      availableBags: toNum(line.availableBags),
      availableKg: toNum(line.availableKg),
    });
  });

  const existing = map.get(bagSizeKg) || {
    bagSizeKg,
    availableBags: 0,
    availableKg: 0,
  };

  const nextBags = Math.max(0, existing.availableBags + bagDelta);
  const nextKg = nextBags * bagSizeKg;

  if (nextBags === 0) {
    map.delete(bagSizeKg);
  } else {
    map.set(bagSizeKg, {
      bagSizeKg,
      availableBags: nextBags,
      availableKg: nextKg,
    });
  }

  return Array.from(map.values()).sort((a, b) => b.bagSizeKg - a.bagSizeKg);
};

const formatBagBreakdown = (breakdown?: BagBreakdownLine[]) => {
  if (!breakdown || breakdown.length === 0) return "No bag breakdown yet";
  return breakdown
    .map((line) => `${line.availableBags} x ${line.bagSizeKg}kg`)
    .join(", ");
};

const timestampLabel = (value: any) => {
  const date = value?.toDate?.() ?? (value?.seconds ? new Date(value.seconds * 1000) : null);
  return date ? date.toLocaleString("en-GB") : "-";
};

const itemLabel = (item: InventoryItem) =>
  [item.farm, item.harvestYear, item.variety, item.process].filter(Boolean).join(" - ");

const normalizeMatchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const suggestInventoryMatch = (items: InventoryItem[], variety: string) => {
  const target = normalizeMatchText(variety);
  if (!target) return "";

  const exact = items.find((item) => normalizeMatchText(itemLabel(item)) === target);
  if (exact) return exact.id;

  const loose = items.find((item) => {
    const label = normalizeMatchText(itemLabel(item));
    const itemCore = normalizeMatchText([item.harvestYear, item.variety].filter(Boolean).join(" "));
    return label.includes(target) || target.includes(itemCore);
  });

  return loose?.id || "";
};

const reservationLineKey = (
  inventoryItemId: string | null,
  bagKg: number,
  selectionIndex: number | null
) => `${selectionIndex ?? "line"}:${inventoryItemId || "missing"}:${bagKg}`;

const InventoryManager: React.FC = () => {
  const db = getFirestore();
  const { currentUser } = useAuth();

  const [activeView, setActiveView] = useState<InventoryView>("stock");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [accessUsers, setAccessUsers] = useState<InventoryAccessUser[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<InventoryItem | null>(null);
  const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [deleteItemError, setDeleteItemError] = useState("");

  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [lineItemId, setLineItemId] = useState("");
  const [lineBags, setLineBags] = useState("");
  const [lineBagSizeKg, setLineBagSizeKg] = useState("24");
  const [lineCostPerKg, setLineCostPerKg] = useState("");
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);

  const [adjustItemId, setAdjustItemId] = useState("");
  const [adjustMode, setAdjustMode] = useState<"increase" | "decrease">("increase");
  const [adjustBags, setAdjustBags] = useState("");
  const [adjustBagSizeKg, setAdjustBagSizeKg] = useState("24");
  const [adjustReason, setAdjustReason] = useState("Opening balance");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [migrationRows, setMigrationRows] = useState<MigrationRow[]>([]);
  const [migrationSelections, setMigrationSelections] = useState<Record<string, string>>({});
  const [loadingMigration, setLoadingMigration] = useState(false);
  const [migratingKey, setMigratingKey] = useState<string | null>(null);
  const [repairRows, setRepairRows] = useState<ReservationRepairRow[]>([]);
  const [loadingRepair, setLoadingRepair] = useState(false);
  const [repairingContractId, setRepairingContractId] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [itemsSnap, groupsSnap, entriesSnap, lotsSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "inventoryItems"), orderBy("farm"))),
        getDocs(query(collection(db, "groups"), orderBy("name"))),
        getDocs(query(collection(db, "stockEntries"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "stockLots"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "users")),
      ]);

      const users: InventoryAccessUser[] = usersSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          uid: String(data.uid || d.id),
          groups: normalizeGroupList(data.groups),
        };
      });
      setAccessUsers(users);

      const inventoryItems = itemsSnap.docs.map((d) => ({
          id: d.id,
          availableBags: 0,
          availableKg: 0,
          groupNames: [],
          allowedUserIds: [],
          isActive: true,
          ...(d.data() as any),
        }));

      setItems(inventoryItems);

      await Promise.all(
        inventoryItems.map((item) => {
          const nextAllowedUserIds = sortedUnique(
            allowedUsersForGroups(users, item.groupNames || [])
          );

          if (sameStringList(item.allowedUserIds || [], nextAllowedUserIds)) {
            return Promise.resolve();
          }

          return updateDoc(doc(db, "inventoryItems", item.id), {
            allowedUserIds: nextAllowedUserIds,
            updatedAt: serverTimestamp(),
          });
        })
      );

      setGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      setEntries(
        entriesSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );

      setLots(
        lotsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    } catch (error) {
      console.error("Error loading inventory:", error);
      alert("Failed to load inventory data. Check Firestore permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchDeveloperRole = async () => {
      if (!currentUser?.uid) {
        setIsDeveloper(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const roles = snap.exists() ? snap.data()?.roles : [];
        setIsDeveloper(Array.isArray(roles) && roles.includes("developer"));
      } catch (error) {
        console.error("Error checking developer role:", error);
        setIsDeveloper(false);
      }
    };

    fetchDeveloperRole();
  }, [currentUser?.uid, db]);

  const fetchMigrationRows = async () => {
    try {
      setLoadingMigration(true);
      const snap = await getDocs(collection(db, "contracts"));
      const rows: MigrationRow[] = [];
      const nextSelections: Record<string, string> = {};

      snap.docs.forEach((contractDoc) => {
        const contract = contractDoc.data() as any;
        if (String(contract.status || "").toLowerCase() !== "active") return;

        const selections = contract.details?.selections || contract.selections || [];
        if (!Array.isArray(selections)) return;

        selections.forEach((selection: any, selectionIndex: number) => {
          if (selection.inventoryItemId) return;

          const remainingBags = toNum(selection.remainingBags ?? selection.bags ?? 0);
          if (remainingBags <= 0) return;

          const bagKg = toNum(selection.bagKg ?? contract.details?.totals?.pricePerBagKg ?? 24, 24);
          const remainingKg = toNum(selection.remainingKg ?? remainingBags * bagKg);
          const key = `${contractDoc.id}:${selectionIndex}`;
          const variety = String(selection.variety || "").trim();

          rows.push({
            key,
            contractId: contractDoc.id,
            contractNo: contract.contractNo || contractDoc.id,
            customerName: contract.name || contract.details?.customer?.fullName || "(No name)",
            customerEmail: contract.email || contract.details?.customer?.email || "",
            selectionIndex,
            variety,
            remainingBags,
            remainingKg,
            bagKg,
          });

          nextSelections[key] = suggestInventoryMatch(items, variety);
        });
      });

      rows.sort((a, b) => a.contractNo.localeCompare(b.contractNo));
      setMigrationRows(rows);
      setMigrationSelections(nextSelections);
    } catch (error) {
      console.error("Error loading contract migration rows:", error);
      alert("Failed to load contract migration data.");
    } finally {
      setLoadingMigration(false);
    }
  };

  const fetchReservationRepairRows = async () => {
    try {
      setLoadingRepair(true);
      const contractsSnap = await getDocs(collection(db, "contracts"));
      const activeContracts = contractsSnap.docs.filter(
        (contractDoc) =>
          String((contractDoc.data() as any).status || "").toLowerCase() === "active"
      );

      const rows = await Promise.all(
        activeContracts.map(async (contractDoc) => {
          const contract = contractDoc.data() as any;
          const selections = contract.details?.selections || contract.selections || [];
          if (!Array.isArray(selections)) return null;

          const requiredLines: ReservationRepairLine[] = selections
            .map((selection: any, selectionIndex: number) => {
              const requiredBags = toNum(selection.remainingBags ?? selection.bags ?? 0);
              if (requiredBags <= 0) return null;

              const bagKg = toNum(
                selection.bagKg ?? contract.details?.totals?.pricePerBagKg ?? 24,
                24
              );
              const inventoryItemId = selection.inventoryItemId
                ? String(selection.inventoryItemId)
                : null;
              const requiredKg = toNum(selection.remainingKg ?? requiredBags * bagKg);
              const label = String(selection.variety || selection.label || "Contract coffee");
              const key = reservationLineKey(inventoryItemId, bagKg, selectionIndex);

              return {
                key,
                inventoryItemId,
                label,
                selectionIndex,
                bagKg,
                requiredBags,
                requiredKg,
                reservedBags: 0,
                missingBags: requiredBags,
                missingKg: requiredKg,
              };
            })
            .filter(Boolean) as ReservationRepairLine[];

          if (!requiredLines.length) return null;

          const reservationsSnap = await getDocs(
            query(
              collection(db, "stockReservations"),
              where("sourceType", "==", "contract"),
              where("sourceId", "==", contractDoc.id)
            )
          );

          const reservedByLine = new Map<string, number>();
          reservationsSnap.docs.forEach((reservationDoc) => {
            const reservation = reservationDoc.data() as any;
            if (String(reservation.status || "active").toLowerCase() !== "active") return;

            const inventoryItemId = reservation.inventoryItemId
              ? String(reservation.inventoryItemId)
              : null;
            const bagKg = toNum(reservation.bagKg ?? reservation.bagSizeKg ?? 24, 24);
            const selectionIndex = toOptionalNum(reservation.selectionIndex);
            const key = reservationLineKey(inventoryItemId, bagKg, selectionIndex);
            reservedByLine.set(key, (reservedByLine.get(key) || 0) + toNum(reservation.bagsReserved));
          });

          const lines = requiredLines.map((line) => {
            const reservedBags = reservedByLine.get(line.key) || 0;
            const missingBags = Math.max(0, line.requiredBags - reservedBags);
            return {
              ...line,
              reservedBags,
              missingBags,
              missingKg: missingBags * line.bagKg,
            };
          });

          const requiredBags = lines.reduce((sum, line) => sum + line.requiredBags, 0);
          const reservedBags = lines.reduce((sum, line) => sum + line.reservedBags, 0);
          const missingBags = lines.reduce((sum, line) => sum + line.missingBags, 0);
          const missingKg = lines.reduce((sum, line) => sum + line.missingKg, 0);
          const hasMissingInventoryIds = lines.some((line) => !line.inventoryItemId);
          const hasSurplusReservation = lines.some((line) => line.reservedBags > line.requiredBags);

          if (!hasMissingInventoryIds && missingBags <= 0 && !hasSurplusReservation) return null;

          return {
            contractId: contractDoc.id,
            contractNo: contract.contractNo || contractDoc.id,
            customerName: contract.name || contract.details?.customer?.fullName || "(No name)",
            customerEmail: contract.email || contract.details?.customer?.email || "",
            requiredBags,
            reservedBags,
            missingBags,
            missingKg,
            hasMissingInventoryIds,
            hasSurplusReservation,
            lines,
          };
        })
      );

      setRepairRows(
        (rows.filter(Boolean) as ReservationRepairRow[]).sort((a, b) =>
          a.contractNo.localeCompare(b.contractNo)
        )
      );
    } catch (error) {
      console.error("Error loading contract reservation repair rows:", error);
      alert("Failed to load contract reservation repair data.");
    } finally {
      setLoadingRepair(false);
    }
  };

  useEffect(() => {
    if (activeView === "migration" && isDeveloper) {
      fetchMigrationRows();
      fetchReservationRepairRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, isDeveloper]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? items.filter((item) =>
          [
            item.farm,
            item.variety,
            item.harvestYear,
            item.process,
            item.tastingNotes,
            ...(item.groupNames || []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(term)
        )
      : items;

    return [...list].sort((a, b) => {
      const bagsDiff = toNum(b.availableBags) - toNum(a.availableBags);
      if (bagsDiff !== 0) return bagsDiff;
      return itemLabel(a).localeCompare(itemLabel(b));
    });
  }, [items, search]);

  const invoiceTotals = useMemo(
    () =>
      invoiceLines.reduce(
        (acc, line) => ({
          bags: acc.bags + line.bags,
          kg: acc.kg + line.totalKg,
        }),
        { bags: 0, kg: 0 }
      ),
    [invoiceLines]
  );

  const lotsByItem = useMemo(() => {
    const map = new Map<string, StockLot[]>();
    lots.forEach((lot) => {
      if (!lot.inventoryItemId || toNum(lot.availableBags) <= 0) return;
      map.set(lot.inventoryItemId, [...(map.get(lot.inventoryItemId) || []), lot]);
    });
    return map;
  }, [lots]);

  const resetItemForm = () => {
    setItemForm(emptyItemForm);
    setActiveView("variety");
  };

  const editItem = (item: InventoryItem) => {
    setItemForm({
      id: item.id,
      farm: item.farm || "",
      variety: item.variety || "",
      harvestYear: item.harvestYear || "",
      process: item.process || "",
      tastingNotes: item.tastingNotes || "",
      bagSizeKg: String(item.bagSizeKg || 24),
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : "",
      groupNames: item.groupNames || [],
      isActive: item.isActive !== false,
    });
    setActiveView("variety");
  };

  const toggleGroup = (groupName: string) => {
    setItemForm((prev) => {
      const exists = prev.groupNames.includes(groupName);
      return {
        ...prev,
        groupNames: exists
          ? prev.groupNames.filter((g) => g !== groupName)
          : [...prev.groupNames, groupName],
      };
    });
  };

  const saveItem = async () => {
    const farm = itemForm.farm.trim();
    const variety = itemForm.variety.trim();
    const process = itemForm.process.trim();
    const bagSizeKg = toNum(itemForm.bagSizeKg, 24);
    const pricePerKg = toNum(itemForm.pricePerKg, 0);

    if (!farm || !variety || !process || bagSizeKg <= 0) {
      alert("Farm, variety, process and bag size are required.");
      return;
    }

    try {
      setSavingItem(true);
      const payload = {
        farm,
        variety,
        harvestYear: itemForm.harvestYear.trim(),
        process,
        tastingNotes: itemForm.tastingNotes.trim(),
        bagSizeKg,
        pricePerKg,
        groupNames: itemForm.groupNames,
        allowedUserIds: sortedUnique(allowedUsersForGroups(accessUsers, itemForm.groupNames)),
        isActive: itemForm.isActive,
        updatedAt: serverTimestamp(),
      };

      if (itemForm.id) {
        await updateDoc(doc(db, "inventoryItems", itemForm.id), payload);
      } else {
        await addDoc(collection(db, "inventoryItems"), {
          ...payload,
          availableBags: 0,
          availableKg: 0,
          totalPurchasedBags: 0,
          totalPurchasedKg: 0,
          createdAt: serverTimestamp(),
        });
      }

      setItemForm(emptyItemForm);
      setActiveView("stock");
      await fetchAll();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save variety. Check Firestore permissions.");
    } finally {
      setSavingItem(false);
    }
  };

  const toggleItemActive = async (item: InventoryItem) => {
    try {
      await updateDoc(doc(db, "inventoryItems", item.id), {
        isActive: !item.isActive,
        updatedAt: serverTimestamp(),
      });
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isActive: !item.isActive } : x))
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Failed to update item status.");
    }
  };

  const getDeleteItemBlockers = (item: InventoryItem) => {
    const blockers: string[] = [];
    const reservedBags = toNum(item.reservedBags || 0);
    const reservedKg = toNum(item.reservedKg || 0);

    if (item.isActive !== false) {
      blockers.push("Mark this variety as inactive before deleting it.");
    }

    if (reservedBags > 0 || reservedKg > 0) {
      blockers.push(
        `This variety still has reserved stock (${reservedBags} bags / ${reservedKg.toLocaleString()} kg). Release or fulfil those reservations first.`
      );
    }

    return blockers;
  };

  const openDeleteItemModal = (item: InventoryItem) => {
    setDeleteItemTarget(item);
    setDeleteItemError("");
    setDeleteItemModalOpen(true);
  };

  const closeDeleteItemModal = () => {
    if (deletingItem) return;
    setDeleteItemTarget(null);
    setDeleteItemError("");
    setDeleteItemModalOpen(false);
  };

  const confirmDeleteItem = async () => {
    if (!deleteItemTarget) return;

    const blockers = getDeleteItemBlockers(deleteItemTarget);
    if (blockers.length) {
      setDeleteItemError(blockers.join(" "));
      return;
    }

    try {
      setDeletingItem(true);
      setDeleteItemError("");

      await writeAuditLog({
        action: "inventory_item_delete",
        status: "started",
        actor: { uid: currentUser?.uid || null, email: currentUser?.email || null },
        targetType: "inventoryItem",
        targetId: deleteItemTarget.id,
        targetLabel: itemLabel(deleteItemTarget),
        before: {
          isActive: deleteItemTarget.isActive,
          reservedBags: toNum(deleteItemTarget.reservedBags || 0),
          reservedKg: toNum(deleteItemTarget.reservedKg || 0),
          availableBags: toNum(deleteItemTarget.availableBags || 0),
        },
      });

      await deleteDoc(doc(db, "inventoryItems", deleteItemTarget.id));

      await writeAuditLog({
        action: "inventory_item_delete",
        status: "success",
        actor: { uid: currentUser?.uid || null, email: currentUser?.email || null },
        targetType: "inventoryItem",
        targetId: deleteItemTarget.id,
        targetLabel: itemLabel(deleteItemTarget),
      });

      setItems((prev) => prev.filter((item) => item.id !== deleteItemTarget.id));
      setExpandedItemId((prev) => (prev === deleteItemTarget.id ? null : prev));
      closeDeleteItemModal();
    } catch (error: any) {
      console.error("Error deleting inventory item:", error);
      setDeleteItemError(error?.message || "Failed to delete variety. Check Firestore permissions.");
      await writeAuditLog({
        action: "inventory_item_delete",
        level: "error",
        status: "failed",
        actor: { uid: currentUser?.uid || null, email: currentUser?.email || null },
        targetType: "inventoryItem",
        targetId: deleteItemTarget.id,
        targetLabel: itemLabel(deleteItemTarget),
        error,
      });
    } finally {
      setDeletingItem(false);
    }
  };

  const addInvoiceLine = () => {
    const selected = items.find((item) => item.id === lineItemId);
    const bags = toNum(lineBags);
    const bagSizeKg = toNum(lineBagSizeKg, selected?.bagSizeKg || 24);
    const costPerKg = toNum(lineCostPerKg);

    if (!selected || bags <= 0 || bagSizeKg <= 0) {
      alert("Select a variety and enter a valid number of bags.");
      return;
    }

    const totalKg = bags * bagSizeKg;
    setInvoiceLines((prev) => [
      ...prev,
      {
        inventoryItemId: selected.id,
        label: itemLabel(selected),
        bags,
        bagSizeKg,
        costPerKg,
        totalKg,
      },
    ]);

    setLineItemId("");
    setLineBags("");
    setLineBagSizeKg("24");
    setLineCostPerKg("");
  };

  const removeInvoiceLine = (index: number) => {
    setInvoiceLines((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmInvoice = async () => {
    if (!invoiceNumber.trim() || !supplier.trim() || !invoiceDate) {
      alert("Invoice number, supplier and invoice date are required.");
      return;
    }

    if (invoiceLines.length === 0) {
      alert("Add at least one coffee line before confirming the invoice.");
      return;
    }

    try {
      setSavingInvoice(true);
      const entryRef = doc(collection(db, "stockEntries"));
      const movementRefs = invoiceLines.map(() => doc(collection(db, "stockMovements")));
      const lotRefs = invoiceLines.map(() => doc(collection(db, "stockLots")));

      await runTransaction(db, async (transaction) => {
        const itemRefs = invoiceLines.map((line) => doc(db, "inventoryItems", line.inventoryItemId));
        const itemSnaps = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));

        itemSnaps.forEach((snap, index) => {
          if (!snap.exists()) {
            throw new Error(`Inventory item not found for line ${index + 1}`);
          }

          const line = invoiceLines[index];
          const current = snap.data() as any;
          const nextBreakdown = applyBagDelta(current.bagBreakdown, line.bagSizeKg, line.bags);
          transaction.update(itemRefs[index], {
            availableBags: toNum(current.availableBags) + line.bags,
            availableKg: toNum(current.availableKg) + line.totalKg,
            bagBreakdown: nextBreakdown,
            totalPurchasedBags: toNum(current.totalPurchasedBags) + line.bags,
            totalPurchasedKg: toNum(current.totalPurchasedKg) + line.totalKg,
            lastStockEntryAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        transaction.set(entryRef, {
          invoiceNumber: invoiceNumber.trim(),
          supplier: supplier.trim(),
          invoiceDate,
          notes: invoiceNotes.trim(),
          status: "confirmed",
          totalBags: invoiceTotals.bags,
          totalKg: invoiceTotals.kg,
          createdBy: currentUser?.uid || null,
          createdByEmail: currentUser?.email || null,
          createdAt: serverTimestamp(),
          items: invoiceLines,
        });

        invoiceLines.forEach((line, index) => {
          transaction.set(lotRefs[index], {
            inventoryItemId: line.inventoryItemId,
            label: line.label,
            bagSizeKg: line.bagSizeKg,
            initialBags: line.bags,
            availableBags: line.bags,
            initialKg: line.totalKg,
            availableKg: line.totalKg,
            costPerKg: line.costPerKg,
            sourceId: entryRef.id,
            sourceType: "invoice",
            invoiceNumber: invoiceNumber.trim(),
            supplier: supplier.trim(),
            createdBy: currentUser?.uid || null,
            createdByEmail: currentUser?.email || null,
            createdAt: serverTimestamp(),
          });

          transaction.set(movementRefs[index], {
            inventoryItemId: line.inventoryItemId,
            type: "purchase",
            quantityBags: line.bags,
            quantityKg: line.totalKg,
            bagSizeKg: line.bagSizeKg,
            costPerKg: line.costPerKg,
            stockLotId: lotRefs[index].id,
            sourceId: entryRef.id,
            sourceType: "invoice",
            invoiceNumber: invoiceNumber.trim(),
            createdBy: currentUser?.uid || null,
            createdByEmail: currentUser?.email || null,
            createdAt: serverTimestamp(),
          });
        });
      });

      setInvoiceNumber("");
      setSupplier("");
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setInvoiceNotes("");
      setInvoiceLines([]);
      setActiveView("stock");
      await fetchAll();
    } catch (error) {
      console.error("Error confirming invoice:", error);
      alert("Failed to confirm invoice. Check Firestore permissions.");
    } finally {
      setSavingInvoice(false);
    }
  };

  const confirmManualAdjustment = async () => {
    const selected = items.find((item) => item.id === adjustItemId);
    const bags = toNum(adjustBags);
    const bagSizeKg = toNum(adjustBagSizeKg, selected?.bagSizeKg || 24);
    const signedBags = adjustMode === "increase" ? bags : -bags;
    const signedKg = signedBags * bagSizeKg;

    if (!selected || bags <= 0 || bagSizeKg <= 0 || !adjustReason.trim()) {
      alert("Select a variety, enter bags/bag size, and add a reason.");
      return;
    }

    try {
      setSavingAdjustment(true);
      const itemRef = doc(db, "inventoryItems", selected.id);
      const movementRef = doc(collection(db, "stockMovements"));
      const lotRef = adjustMode === "increase" ? doc(collection(db, "stockLots")) : null;

      await runTransaction(db, async (transaction) => {
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists()) throw new Error("Inventory item not found.");

        const current = itemSnap.data() as any;
        const currentBags = toNum(current.availableBags);
        const currentKg = toNum(current.availableKg);
        const currentBreakdown = (current.bagBreakdown || []) as BagBreakdownLine[];
        const matchingBreakdown = currentBreakdown.find(
          (line) => toNum(line.bagSizeKg) === bagSizeKg
        );

        if (adjustMode === "decrease") {
          if (bags > currentBags || bags * bagSizeKg > currentKg) {
            throw new Error("Adjustment exceeds total available stock.");
          }
          if (!matchingBreakdown || bags > toNum(matchingBreakdown.availableBags)) {
            throw new Error(`Not enough ${bagSizeKg}kg bags available for this adjustment.`);
          }
        }

        const nextBreakdown = applyBagDelta(currentBreakdown, bagSizeKg, signedBags);

        transaction.update(itemRef, {
          availableBags: Math.max(0, currentBags + signedBags),
          availableKg: Math.max(0, currentKg + signedKg),
          bagBreakdown: nextBreakdown,
          updatedAt: serverTimestamp(),
          lastManualAdjustmentAt: serverTimestamp(),
        });

        if (lotRef && adjustMode === "increase") {
          transaction.set(lotRef, {
            inventoryItemId: selected.id,
            label: itemLabel(selected),
            bagSizeKg,
            initialBags: bags,
            availableBags: bags,
            initialKg: bags * bagSizeKg,
            availableKg: bags * bagSizeKg,
            sourceId: movementRef.id,
            sourceType: "manual",
            notes: adjustNotes.trim(),
            reason: adjustReason.trim(),
            createdBy: currentUser?.uid || null,
            createdByEmail: currentUser?.email || null,
            createdAt: serverTimestamp(),
          });
        }

        transaction.set(movementRef, {
          inventoryItemId: selected.id,
          type: "adjustment",
          adjustmentMode: adjustMode,
          quantityBags: signedBags,
          quantityKg: signedKg,
          bagSizeKg,
          reason: adjustReason.trim(),
          notes: adjustNotes.trim(),
          sourceId: lotRef?.id || null,
          sourceType: "manual",
          createdBy: currentUser?.uid || null,
          createdByEmail: currentUser?.email || null,
          createdAt: serverTimestamp(),
        });
      });

      setAdjustItemId("");
      setAdjustMode("increase");
      setAdjustBags("");
      setAdjustBagSizeKg("24");
      setAdjustReason("Opening balance");
      setAdjustNotes("");
      setActiveView("stock");
      await fetchAll();
    } catch (error: any) {
      console.error("Error confirming adjustment:", error);
      alert(error?.message || "Failed to confirm stock adjustment.");
    } finally {
      setSavingAdjustment(false);
    }
  };

  const migrateContractLine = async (row: MigrationRow) => {
    const inventoryItemId = migrationSelections[row.key];
    const selectedItem = items.find((item) => item.id === inventoryItemId);

    if (!selectedItem) {
      alert("Select an inventory item before migrating this line.");
      return;
    }

    if (
      !window.confirm(
        `Migrate ${row.contractNo} - ${row.variety} to ${itemLabel(selectedItem)}?\n\nThis will reserve ${row.remainingBags} bags.`
      )
    ) {
      return;
    }

    try {
      setMigratingKey(row.key);
      const contractRef = doc(db, "contracts", row.contractId);
      const itemRef = doc(db, "inventoryItems", inventoryItemId);
      const reservationRef = doc(collection(db, "stockReservations"));
      const movementRef = doc(collection(db, "stockMovements"));

      await runTransaction(db, async (transaction) => {
        const [contractSnap, itemSnap] = await Promise.all([
          transaction.get(contractRef),
          transaction.get(itemRef),
        ]);

        if (!contractSnap.exists()) throw new Error("Contract not found.");
        if (!itemSnap.exists()) throw new Error("Inventory item not found.");

        const contract = contractSnap.data() as any;
        const item = itemSnap.data() as any;
        const selections = [...(contract.details?.selections || contract.selections || [])];
        const currentSelection = selections[row.selectionIndex];

        if (!currentSelection) throw new Error("Contract selection not found.");
        if (currentSelection.inventoryItemId) {
          throw new Error("This contract line was already migrated.");
        }

        const availableToReserve = toNum(item.availableBags || 0) - toNum(item.reservedBags || 0);
        if (row.remainingBags > availableToReserve) {
          throw new Error(
            `Only ${availableToReserve} sellable bags are available for ${itemLabel(selectedItem)}.`
          );
        }

        const nextSelection = {
          ...currentSelection,
          inventoryItemId,
          bagKg: row.bagKg,
          migratedToInventoryAt: new Date().toISOString(),
        };
        selections[row.selectionIndex] = nextSelection;

        transaction.update(contractRef, {
          [contract.details?.selections ? "details.selections" : "selections"]: selections,
          updatedAt: serverTimestamp(),
          inventoryMigrationUpdatedAt: serverTimestamp(),
        });

        transaction.update(itemRef, {
          reservedBags: toNum(item.reservedBags || 0) + row.remainingBags,
          reservedKg: toNum(item.reservedKg || 0) + row.remainingKg,
          updatedAt: serverTimestamp(),
        });

        transaction.set(reservationRef, {
          sourceType: "contract",
          sourceId: row.contractId,
          inventoryItemId,
          label: row.variety,
          bagsReserved: row.remainingBags,
          kgReserved: row.remainingKg,
          bagKg: row.bagKg,
          selectionIndex: row.selectionIndex,
          status: "active",
          customerName: row.customerName,
          customerEmail: row.customerEmail,
          contractNo: row.contractNo,
          createdBy: currentUser?.uid || null,
          createdByEmail: currentUser?.email || null,
          createdAt: serverTimestamp(),
        });

        transaction.set(movementRef, {
          inventoryItemId,
          type: "reservation_hold",
          quantityBags: row.remainingBags,
          quantityKg: row.remainingKg,
          bagSizeKg: row.bagKg,
          sourceType: "contract",
          sourceId: row.contractId,
          reservationId: reservationRef.id,
          label: row.variety,
          customerName: row.customerName,
          customerEmail: row.customerEmail,
          contractNo: row.contractNo,
          createdBy: currentUser?.uid || null,
          createdByEmail: currentUser?.email || null,
          createdAt: serverTimestamp(),
        });
      });

      setMigrationRows((prev) => prev.filter((item) => item.key !== row.key));
      setMigrationSelections((prev) => {
        const next = { ...prev };
        delete next[row.key];
        return next;
      });
      await fetchAll();
    } catch (error: any) {
      console.error("Error migrating contract line:", error);
      alert(error?.message || "Failed to migrate contract line.");
    } finally {
      setMigratingKey(null);
    }
  };

  const repairContractReservation = async (row: ReservationRepairRow) => {
    const repairLines = row.lines.filter(
      (line) => line.inventoryItemId && line.missingBags > 0
    );

    if (row.hasMissingInventoryIds) {
      alert("This contract still has lines without an inventory item. Migrate those lines first.");
      return;
    }

    if (!repairLines.length) {
      alert("There is no missing reservation to repair for this contract.");
      return;
    }

    if (
      !window.confirm(
        `Repair reservation for ${row.contractNo}?\n\nThis will reserve ${row.missingBags} missing bags.`
      )
    ) {
      return;
    }

    try {
      setRepairingContractId(row.contractId);
      await writeAuditLog({
        action: "contract_reservation_repair",
        status: "started",
        actor: { uid: currentUser?.uid || null, email: currentUser?.email || null },
        targetType: "contract",
        targetId: row.contractId,
        targetLabel: row.contractNo,
        context: { missingBags: row.missingBags, missingKg: row.missingKg },
      });

      await reserveInventoryForSource({
        sourceType: "contract",
        sourceId: row.contractId,
        lines: repairLines.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          label: line.label,
          bags: line.missingBags,
          bagKg: line.bagKg,
          selectionIndex: line.selectionIndex,
        })),
        createdBy: currentUser?.uid || null,
        createdByEmail: currentUser?.email || null,
      });

      await writeAuditLog({
        action: "contract_reservation_repair",
        status: "success",
        actor: { uid: currentUser?.uid || null, email: currentUser?.email || null },
        targetType: "contract",
        targetId: row.contractId,
        targetLabel: row.contractNo,
        context: { missingBags: row.missingBags, missingKg: row.missingKg },
      });

      await fetchAll();
      await fetchReservationRepairRows();
    } catch (error: any) {
      console.error("Error repairing contract reservation:", error);
      await writeAuditLog({
        action: "contract_reservation_repair",
        level: "error",
        status: "failed",
        actor: { uid: currentUser?.uid || null, email: currentUser?.email || null },
        targetType: "contract",
        targetId: row.contractId,
        targetLabel: row.contractNo,
        context: { missingBags: row.missingBags, missingKg: row.missingKg },
        error,
      });
      alert(error?.message || "Failed to repair contract reservation.");
    } finally {
      setRepairingContractId(null);
    }
  };

  const renderStockView = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm, variety, process or group..."
            className="border border-gray-300 px-2 py-1 rounded-md text-sm w-full md:w-80 bg-white"
          />
          <button
            type="button"
            onClick={resetItemForm}
            className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center justify-center gap-2 border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]"
          >
            <FontAwesomeIcon icon={faPlus} />
            New variety
          </button>
        </div>

        <button onClick={fetchAll} className="text-gray-500 hover:text-gray-700" title="Refresh">
          <FontAwesomeIcon icon={faRotate} className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading inventory...</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No inventory items found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Coffee</th>
                  <th className="px-3 py-2 text-left font-semibold">Breakdown</th>
                  <th className="px-3 py-2 text-right font-semibold">Stock</th>
                  <th className="px-3 py-2 text-right font-semibold">Reserved</th>
                  <th className="px-3 py-2 text-right font-semibold">Kg</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-left font-semibold">Updated</th>
                  <th className="px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredItems.map((item) => {
                  const expanded = expandedItemId === item.id;
                  const reservedBags = toNum(item.reservedBags || 0);
                  const sellableBags = Math.max(0, toNum(item.availableBags) - reservedBags);

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 align-top">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-gray-900 truncate">
                              {itemLabel(item)}
                            </span>
                            {!item.isActive && (
                              <span className="text-[10px] font-semibold px-2 py-[1px] rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                INACTIVE
                              </span>
                            )}
                            {item.groupNames?.length > 0 && (
                              <span className="text-[10px] font-semibold px-2 py-[1px] rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                                EXCLUSIVE
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 max-w-[360px] truncate text-xs text-gray-500">
                            {item.tastingNotes || "No tasting notes"}
                          </p>
                          {item.groupNames?.length > 0 && (
                            <p className="mt-0.5 max-w-[360px] truncate text-[11px] text-gray-400">
                              {(item.groupNames || []).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-gray-600">
                          {formatBagBreakdown(item.bagBreakdown)}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <span className="font-semibold text-gray-900">
                            {item.availableBags || 0}
                          </span>
                          <span className="text-xs text-gray-500"> bags</span>
                          {reservedBags > 0 && (
                            <p className="text-[11px] text-emerald-700">
                              {sellableBags} sellable
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          {reservedBags > 0 ? (
                            <span className="font-medium text-amber-700">{reservedBags}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-right text-gray-700">
                          {(item.availableKg || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 align-top text-right text-gray-700">
                          GBP {item.pricePerKg || 0}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-gray-500">
                          {timestampLabel(item.updatedAt)}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedItemId((prev) => (prev === item.id ? null : item.id))
                            }
                            className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                            title={expanded ? "Hide details" : "Show details"}
                          >
                            <FontAwesomeIcon
                              icon={expanded ? faChevronUp : faChevronDown}
                              className="text-gray-500"
                            />
                          </button>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={8} className="bg-gray-50 px-3 py-3">
                            <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Price / kg</p>
                        <p className="text-gray-900">GBP {item.pricePerKg || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Bag size</p>
                        <p className="text-gray-900">Default: {item.bagSizeKg || 24} kg</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Purchased</p>
                        <p className="text-gray-900">
                          {item.totalPurchasedBags || 0} bags / {(item.totalPurchasedKg || 0).toLocaleString()} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Updated</p>
                        <p className="text-gray-900">{timestampLabel(item.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-gray-200 bg-white overflow-hidden">
                      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">Available lots</p>
                        <span className="text-xs text-gray-500">
                          {(lotsByItem.get(item.id) || []).length} lot(s)
                        </span>
                      </div>
                      {(lotsByItem.get(item.id) || []).length === 0 ? (
                        <p className="px-3 py-2 text-sm text-gray-500 italic">
                          No active lots recorded yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr className="text-left">
                                <th className="px-3 py-2 border-b">Source</th>
                                <th className="px-3 py-2 border-b text-right">Bags</th>
                                <th className="px-3 py-2 border-b text-right">Kg / bag</th>
                                <th className="px-3 py-2 border-b text-right">Available kg</th>
                                <th className="px-3 py-2 border-b">Created</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(lotsByItem.get(item.id) || []).map((lot) => (
                                <tr key={lot.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 border-b">
                                    {lot.invoiceNumber || lot.reason || lot.sourceType}
                                  </td>
                                  <td className="px-3 py-2 border-b text-right">{lot.availableBags}</td>
                                  <td className="px-3 py-2 border-b text-right">{lot.bagSizeKg}</td>
                                  <td className="px-3 py-2 border-b text-right">{lot.availableKg}</td>
                                  <td className="px-3 py-2 border-b">{timestampLabel(lot.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => editItem(item)}
                        className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-100"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-gray-600" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleItemActive(item)}
                        className="h-9 px-3 rounded-md text-sm font-medium border border-gray-200 bg-white hover:bg-gray-100"
                      >
                        {item.isActive ? "Mark inactive" : "Mark active"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteItemModal(item)}
                        className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border border-red-200 bg-white text-red-700 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete
                      </button>
                    </div>
                  </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteItemModalOpen && deleteItemTarget && (() => {
        const blockers = getDeleteItemBlockers(deleteItemTarget);
        const canDelete = blockers.length === 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete variety</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {itemLabel(deleteItemTarget)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDeleteItemModal}
                  disabled={deletingItem}
                  className="h-8 w-8 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {canDelete ? (
                <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  This will permanently delete the variety from inventory. This action cannot be undone.
                </p>
              ) : (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">This variety cannot be deleted yet.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}

              {deleteItemError && (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {deleteItemError}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDeleteItemModal}
                  disabled={deletingItem}
                  className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {canDelete ? "Cancel" : "Close"}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={confirmDeleteItem}
                    disabled={deletingItem}
                    className="h-9 px-3 rounded-md border border-red-600 bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingItem ? "Deleting..." : "Delete variety"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );

  const renderVarietyForm = () => (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-700">Farm</label>
          <input
            value={itemForm.farm}
            onChange={(e) => setItemForm((prev) => ({ ...prev, farm: e.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Variety</label>
          <input
            value={itemForm.variety}
            onChange={(e) => setItemForm((prev) => ({ ...prev, variety: e.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Harvest year</label>
          <input
            value={itemForm.harvestYear}
            onChange={(e) => setItemForm((prev) => ({ ...prev, harvestYear: e.target.value }))}
            placeholder="2026"
            className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Process</label>
          <input
            value={itemForm.process}
            onChange={(e) => setItemForm((prev) => ({ ...prev, process: e.target.value }))}
            placeholder="Washed, Honey, Natural..."
            className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Bag size (kg)</label>
          <input
            type="number"
            value={itemForm.bagSizeKg}
            onChange={(e) => setItemForm((prev) => ({ ...prev, bagSizeKg: e.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Selling price / kg</label>
          <input
            type="number"
            step="0.01"
            value={itemForm.pricePerKg}
            onChange={(e) => setItemForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
            className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-700">Tasting notes</label>
          <textarea
            value={itemForm.tastingNotes}
            onChange={(e) => setItemForm((prev) => ({ ...prev, tastingNotes: e.target.value }))}
            className="mt-1 w-full min-h-[80px] border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-700">Exclusive groups</p>
          <p className="text-xs text-gray-500">
            Empty means visible to all active portal users.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {groups.length === 0 ? (
            <span className="text-sm text-gray-500 italic">No groups created yet.</span>
          ) : (
            groups.map((group) => {
              const selected = itemForm.groupNames.includes(group.name);
              return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => toggleGroup(group.name)}
                  className={[
                    "text-xs px-3 py-1 rounded-full border transition",
                    selected
                      ? "bg-[#174B3D] text-white border-[#174B3D]"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {group.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={itemForm.isActive}
          onChange={(e) => setItemForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          className="h-4 w-4"
        />
        Active in inventory
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setItemForm(emptyItemForm);
            setActiveView("stock");
          }}
          className="h-9 px-3 rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveItem}
          disabled={savingItem}
          className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d] disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faSave} />
          {savingItem ? "Saving..." : itemForm.id ? "Save changes" : "Create variety"}
        </button>
      </div>
    </div>
  );

  const renderInvoiceForm = () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Invoice number</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Supplier</label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Invoice date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700">Notes</label>
          <textarea
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
            className="mt-1 w-full min-h-[70px] border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add coffee line</h3>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <select
            value={lineItemId}
            onChange={(e) => {
              const selected = items.find((item) => item.id === e.target.value);
              setLineItemId(e.target.value);
              setLineBagSizeKg(String(selected?.bagSizeKg || 24));
            }}
            className="lg:col-span-5 border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          >
            <option value="">Select variety...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {itemLabel(item)}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={lineBags}
            onChange={(e) => setLineBags(e.target.value)}
            placeholder="Bags"
            className="lg:col-span-2 border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
          <input
            type="number"
            value={lineBagSizeKg}
            onChange={(e) => setLineBagSizeKg(e.target.value)}
            placeholder="Kg / bag"
            className="lg:col-span-2 border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
          <input
            type="number"
            step="0.01"
            value={lineCostPerKg}
            onChange={(e) => setLineCostPerKg(e.target.value)}
            placeholder="Cost / kg"
            className="lg:col-span-2 border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
          />
          <button
            type="button"
            onClick={addInvoiceLine}
            className="lg:col-span-1 h-10 rounded-md border bg-white hover:bg-gray-50"
            title="Add line"
          >
            <FontAwesomeIcon icon={faPlus} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Invoice lines</h3>
          <span className="text-xs text-gray-500">
            {invoiceTotals.bags} bags / {invoiceTotals.kg.toLocaleString()} kg
          </span>
        </div>
        {invoiceLines.length === 0 ? (
          <p className="p-3 text-sm text-gray-500 italic">No lines added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-3 py-2 border-b">Coffee</th>
                  <th className="px-3 py-2 border-b text-right">Bags</th>
                  <th className="px-3 py-2 border-b text-right">Kg / bag</th>
                  <th className="px-3 py-2 border-b text-right">Total kg</th>
                  <th className="px-3 py-2 border-b text-right">Cost / kg</th>
                  <th className="px-3 py-2 border-b text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceLines.map((line, index) => (
                  <tr key={`${line.inventoryItemId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-b">{line.label}</td>
                    <td className="px-3 py-2 border-b text-right">{line.bags}</td>
                    <td className="px-3 py-2 border-b text-right">{line.bagSizeKg}</td>
                    <td className="px-3 py-2 border-b text-right">{line.totalKg}</td>
                    <td className="px-3 py-2 border-b text-right">{line.costPerKg || "-"}</td>
                    <td className="px-3 py-2 border-b text-right">
                      <button
                        type="button"
                        onClick={() => removeInvoiceLine(index)}
                        className="h-8 w-8 rounded-md border border-red-200 bg-white hover:bg-red-50"
                        title="Remove line"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setActiveView("stock")}
          className="h-9 px-3 rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirmInvoice}
          disabled={savingInvoice}
          className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d] disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faReceipt} />
          {savingInvoice ? "Confirming..." : "Confirm invoice"}
        </button>
      </div>
    </div>
  );

  const renderAdjustmentForm = () => {
    const selected = items.find((item) => item.id === adjustItemId);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Use this for opening balances, corrections, damaged stock, recounts or historical stock
          you do not want to enter as old invoices.
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5">
              <label className="text-xs font-semibold text-gray-700">Variety</label>
              <select
                value={adjustItemId}
                onChange={(e) => {
                  const item = items.find((x) => x.id === e.target.value);
                  setAdjustItemId(e.target.value);
                  setAdjustBagSizeKg(String(item?.bagSizeKg || 24));
                }}
                className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
              >
                <option value="">Select variety...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {itemLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Mode</label>
              <select
                value={adjustMode}
                onChange={(e) => setAdjustMode(e.target.value as "increase" | "decrease")}
                className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Bags</label>
              <input
                type="number"
                value={adjustBags}
                onChange={(e) => setAdjustBags(e.target.value)}
                className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-semibold text-gray-700">Bag size (kg)</label>
              <input
                type="number"
                value={adjustBagSizeKg}
                onChange={(e) => setAdjustBagSizeKg(e.target.value)}
                className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
              />
            </div>
          </div>

          {selected && (
            <div className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-600">Current stock</p>
              <p className="text-sm text-gray-900">
                {selected.availableBags || 0} bags / {(selected.availableKg || 0).toLocaleString()} kg
              </p>
              <p className="text-xs text-gray-500">
                {formatBagBreakdown(selected.bagBreakdown)}
              </p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Reason</label>
              <input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Opening balance, recount, damaged bags..."
                className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Notes</label>
              <input
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md text-sm bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setActiveView("stock")}
            className="h-9 px-3 rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmManualAdjustment}
            disabled={savingAdjustment}
            className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d] disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faSave} />
            {savingAdjustment ? "Saving..." : "Confirm adjustment"}
          </button>
        </div>
      </div>
    );
  };

  const renderMigrationTool = () => {
    if (!isDeveloper) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          This tool is only available for developer users.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-amber-900">Contract migration</h3>
              <p className="text-sm text-amber-800">
                Link active legacy contract lines to inventory items and reserve the remaining stock.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchMigrationRows}
              disabled={loadingMigration}
              className="h-9 px-3 rounded-md text-sm font-medium border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-60"
            >
              {loadingMigration ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {loadingMigration ? (
          <p className="text-sm text-gray-500">Loading active contracts...</p>
        ) : migrationRows.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            No active contract lines need migration.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Contract</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Legacy variety</th>
                    <th className="px-3 py-2 text-right">Remaining</th>
                    <th className="px-3 py-2 text-left">Inventory match</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {migrationRows.map((row) => {
                    const selectedItemId = migrationSelections[row.key] || "";
                    const selectedItem = items.find((item) => item.id === selectedItemId);

                    return (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="px-3 py-2 align-top font-semibold text-gray-900">
                          {row.contractNo}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <p className="font-medium text-gray-900">{row.customerName}</p>
                          <p className="text-xs text-gray-500">{row.customerEmail || "-"}</p>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <p className="font-medium text-gray-900">{row.variety}</p>
                          <p className="text-xs text-gray-500">Selection #{row.selectionIndex + 1}</p>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <p className="font-semibold text-gray-900">{row.remainingBags} bags</p>
                          <p className="text-xs text-gray-500">
                            {row.remainingKg.toLocaleString()} kg ({row.bagKg}kg)
                          </p>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={selectedItemId}
                            onChange={(event) =>
                              setMigrationSelections((prev) => ({
                                ...prev,
                                [row.key]: event.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">Select inventory item...</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {itemLabel(item)} - {item.availableBags || 0} bags
                              </option>
                            ))}
                          </select>
                          {selectedItem && (
                            <p className="mt-1 text-xs text-gray-500">
                              Will reserve from: {formatBagBreakdown(selectedItem.bagBreakdown)}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            type="button"
                            onClick={() => migrateContractLine(row)}
                            disabled={!selectedItemId || migratingKey === row.key}
                            className="h-9 px-3 rounded-md text-sm font-medium border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d] disabled:opacity-50"
                          >
                            {migratingKey === row.key ? "Migrating..." : "Migrate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Reservation repair</h3>
              <p className="text-sm text-emerald-900">
                Find active contracts whose remaining coffee is not fully reserved in inventory.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchReservationRepairRows}
              disabled={loadingRepair}
              className="h-9 px-3 rounded-md text-sm font-medium border border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100 disabled:opacity-60"
            >
              {loadingRepair ? "Loading..." : "Refresh repairs"}
            </button>
          </div>
        </div>

        {loadingRepair ? (
          <p className="text-sm text-gray-500">Checking active contract reservations...</p>
        ) : repairRows.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            No active contracts need reservation repair.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Contract</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-right">Required</th>
                    <th className="px-3 py-2 text-right">Recorded reserve</th>
                    <th className="px-3 py-2 text-right">Missing</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {repairRows.map((row) => {
                    const canRepair =
                      !row.hasMissingInventoryIds &&
                      !row.hasSurplusReservation &&
                      row.missingBags > 0;

                    return (
                      <tr key={row.contractId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 align-top font-semibold text-gray-900">
                          {row.contractNo}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <p className="font-medium text-gray-900">{row.customerName}</p>
                          <p className="text-xs text-gray-500">{row.customerEmail || "-"}</p>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <p className="font-semibold text-gray-900">{row.requiredBags} bags</p>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <p className="font-semibold text-gray-900">{row.reservedBags} bags</p>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <p className="font-semibold text-red-700">{row.missingBags} bags</p>
                          <p className="text-xs text-gray-500">
                            {row.missingKg.toLocaleString()} kg
                          </p>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {row.hasMissingInventoryIds ? (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                              Needs migration first
                            </span>
                          ) : row.hasSurplusReservation ? (
                            <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-700">
                              Review manually
                            </span>
                          ) : (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                              Missing reserve
                            </span>
                          )}
                          <div className="mt-2 space-y-1 text-xs text-gray-500">
                            {row.lines.map((line) => (
                              <p key={line.key}>
                                {line.label}: {line.requiredBags} required / {line.reservedBags} reserved
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            type="button"
                            onClick={() => repairContractReservation(row)}
                            disabled={!canRepair || repairingContractId === row.contractId}
                            className="h-9 px-3 rounded-md text-sm font-medium border bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d] disabled:opacity-50"
                          >
                            {repairingContractId === row.contractId ? "Repairing..." : "Repair"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEntriesList = () => (
    <div className="mt-5 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recent stock entries</h3>
        <span className="text-xs text-gray-500">{entries.length} invoice(s)</span>
      </div>
      {entries.length === 0 ? (
        <p className="p-3 text-sm text-gray-500 italic">No stock entries yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.slice(0, 8).map((entry) => (
            <div key={entry.id} className="px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Invoice {entry.invoiceNumber || entry.id}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {entry.supplier || "No supplier"} - {entry.invoiceDate || "No date"} - {timestampLabel(entry.createdAt)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">{entry.totalBags || 0} bags</p>
                <p className="text-xs text-gray-500">{(entry.totalKg || 0).toLocaleString()} kg</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between gap-3 mb-4 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500">
            Manage coffee varieties, exclusive groups and invoice-based stock entries.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <span>{items.length} varieties</span>
          <span>-</span>
          <span>{entries.length} invoices</span>
        </div>
      </div>

      <div className="flex gap-4 mb-4 border-b overflow-x-auto">
        {[
          { id: "stock" as const, label: "Inventory", icon: faBoxesStacked, show: true },
          { id: "variety" as const, label: itemForm.id ? "Edit variety" : "New variety", icon: faPlus, show: true },
          { id: "invoice" as const, label: "Invoices", icon: faReceipt, show: true },
          { id: "adjust" as const, label: "Adjust stock", icon: faPen, show: true },
          { id: "migration" as const, label: "Migration", icon: faCodeBranch, show: isDeveloper },
        ].filter((tab) => tab.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`py-2 px-2 font-semibold text-sm whitespace-nowrap inline-flex items-center gap-2 ${
              activeView === tab.id
                ? "border-b-2 border-[#174B3D] text-[#174B3D]"
                : "text-gray-500"
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === "stock" && (
        <>
          {renderStockView()}
          {renderEntriesList()}
        </>
      )}
      {activeView === "variety" && renderVarietyForm()}
      {activeView === "invoice" && (
        <>
          {renderInvoiceForm()}
          {renderEntriesList()}
        </>
      )}
      {activeView === "adjust" && (
        <>
          {renderAdjustmentForm()}
          {renderEntriesList()}
        </>
      )}
      {activeView === "migration" && renderMigrationTool()}
    </div>
  );
};

export default InventoryManager;
