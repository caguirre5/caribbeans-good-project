import {
  collection,
  doc,
  getFirestore,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { writeAuditLog } from "./auditLog";

export type InventoryStockLine = {
  inventoryItemId?: string | null;
  label: string;
  bags: number;
  bagKg?: number;
  unitPricePerKg?: number;
  selectionIndex?: number;
};

type BagBreakdownLine = {
  bagSizeKg: number;
  availableBags: number;
  availableKg: number;
};

const toNum = (value: unknown, fallback = 0) => {
  const n =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

const applyBagDelta = (
  currentBreakdown: BagBreakdownLine[] | undefined,
  bagSizeKg: number,
  bagDelta: number
) => {
  const next = (currentBreakdown || []).map((line) => ({
    bagSizeKg: toNum(line.bagSizeKg),
    availableBags: toNum(line.availableBags),
    availableKg: toNum(line.availableKg),
  }));

  const existing = next.find((line) => line.bagSizeKg === bagSizeKg);
  if (!existing) {
    if (bagDelta <= 0) {
      throw new Error(`Not enough ${bagSizeKg}kg bags available.`);
    }

    next.push({
      bagSizeKg,
      availableBags: bagDelta,
      availableKg: bagDelta * bagSizeKg,
    });
  } else {
    const nextBags = existing.availableBags + bagDelta;
    if (nextBags < 0) {
      throw new Error(`Not enough ${bagSizeKg}kg bags available.`);
    }

    existing.availableBags = nextBags;
    existing.availableKg = nextBags * bagSizeKg;
  }

  return next
    .filter((line) => line.availableBags > 0)
    .sort((a, b) => a.bagSizeKg - b.bagSizeKg);
};

const normalizeLines = (lines: InventoryStockLine[]) =>
  lines
    .map((line) => ({
      ...line,
      inventoryItemId: line.inventoryItemId || null,
      bags: toNum(line.bags),
      bagKg: toNum(line.bagKg, 24),
    }))
    .filter((line) => line.bags > 0);

const assertLinesHaveIds = (lines: ReturnType<typeof normalizeLines>) => {
  const missing = lines.filter((line) => !line.inventoryItemId);
  if (missing.length) {
    throw new Error(
      `Inventory item id is missing for: ${missing.map((line) => line.label).join(", ")}`
    );
  }
};

export const reserveInventoryForSource = async ({
  sourceType,
  sourceId,
  lines,
  createdBy,
  createdByEmail,
}: {
  sourceType: "contract";
  sourceId: string;
  lines: InventoryStockLine[];
  createdBy?: string | null;
  createdByEmail?: string | null;
}) => {
  const normalized = normalizeLines(lines);
  if (!normalized.length) return;
  assertLinesHaveIds(normalized);

  const db = getFirestore();
  try {
    await runTransaction(db, async (transaction) => {
      const reservationRefs = normalized.map(() => doc(collection(db, "stockReservations")));
      const movementRefs = normalized.map(() => doc(collection(db, "stockMovements")));
      const itemRefs = normalized.map((line) => doc(db, "inventoryItems", line.inventoryItemId!));
      const itemSnaps = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));

      normalized.forEach((line, index) => {
        const itemSnap = itemSnaps[index];
        if (!itemSnap.exists()) throw new Error(`Inventory item not found: ${line.label}`);

        const current = itemSnap.data() as any;
        const availableBags = toNum(current.availableBags);
        const reservedBags = toNum(current.reservedBags);
        const availableToReserve = availableBags - reservedBags;

        if (line.bags > availableToReserve) {
          throw new Error(
            `Only ${availableToReserve} bags are available to reserve for ${line.label}.`
          );
        }

        const kg = line.bags * line.bagKg;

        transaction.update(itemRefs[index], {
          reservedBags: increment(line.bags),
          reservedKg: increment(kg),
          updatedAt: serverTimestamp(),
        });

        transaction.set(reservationRefs[index], {
          sourceType,
          sourceId,
          inventoryItemId: line.inventoryItemId,
          label: line.label,
          bagsReserved: line.bags,
          kgReserved: kg,
          bagKg: line.bagKg,
          selectionIndex: line.selectionIndex ?? null,
          status: "active",
          createdBy: createdBy || null,
          createdByEmail: createdByEmail || null,
          createdAt: serverTimestamp(),
        });

        transaction.set(movementRefs[index], {
          inventoryItemId: line.inventoryItemId,
          type: "reservation_hold",
          quantityBags: line.bags,
          quantityKg: kg,
          bagSizeKg: line.bagKg,
          sourceType,
          sourceId,
          reservationId: reservationRefs[index].id,
          label: line.label,
          createdBy: createdBy || null,
          createdByEmail: createdByEmail || null,
          createdAt: serverTimestamp(),
        });
      });
    });

    await writeAuditLog({
      action: "inventory_reservation_hold",
      status: "success",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized },
    });
  } catch (error) {
    await writeAuditLog({
      action: "inventory_reservation_hold",
      level: "error",
      status: "failed",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized },
      error,
    });
    throw error;
  }
};

export const releaseInventoryReservation = async ({
  sourceType,
  sourceId,
  lines,
  createdBy,
  createdByEmail,
}: {
  sourceType: "contract";
  sourceId: string;
  lines: InventoryStockLine[];
  createdBy?: string | null;
  createdByEmail?: string | null;
}) => {
  const normalized = normalizeLines(lines);
  if (!normalized.length) return;
  assertLinesHaveIds(normalized);

  const db = getFirestore();
  try {
    await runTransaction(db, async (transaction) => {
      const movementRefs = normalized.map(() => doc(collection(db, "stockMovements")));
      const itemRefs = normalized.map((line) => doc(db, "inventoryItems", line.inventoryItemId!));
      const itemSnaps = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));

      normalized.forEach((line, index) => {
        const itemSnap = itemSnaps[index];
        if (!itemSnap.exists()) throw new Error(`Inventory item not found: ${line.label}`);

        const current = itemSnap.data() as any;
        const reservedBags = toNum(current.reservedBags);
        const bagsToRelease = Math.min(line.bags, reservedBags);
        const kgToRelease = bagsToRelease * line.bagKg;

        transaction.update(itemRefs[index], {
          reservedBags: increment(-bagsToRelease),
          reservedKg: increment(-kgToRelease),
          updatedAt: serverTimestamp(),
        });

        transaction.set(movementRefs[index], {
          inventoryItemId: line.inventoryItemId,
          type: "reservation_release",
          quantityBags: -bagsToRelease,
          quantityKg: -kgToRelease,
          bagSizeKg: line.bagKg,
          sourceType,
          sourceId,
          label: line.label,
          createdBy: createdBy || null,
          createdByEmail: createdByEmail || null,
          createdAt: serverTimestamp(),
        });
      });
    });

    await writeAuditLog({
      action: "inventory_reservation_release",
      status: "success",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized },
    });
  } catch (error) {
    await writeAuditLog({
      action: "inventory_reservation_release",
      level: "error",
      status: "failed",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized },
      error,
    });
    throw error;
  }
};

export const applyInventoryOutForSource = async ({
  sourceType,
  sourceId,
  lines,
  movementType,
  releaseReserved = false,
  createdBy,
  createdByEmail,
}: {
  sourceType: "order" | "contract";
  sourceId: string;
  lines: InventoryStockLine[];
  movementType: "order_out" | "reservation_fulfillment";
  releaseReserved?: boolean;
  createdBy?: string | null;
  createdByEmail?: string | null;
}) => {
  const normalized = normalizeLines(lines);
  if (!normalized.length) return;
  assertLinesHaveIds(normalized);

  const db = getFirestore();
  try {
    await runTransaction(db, async (transaction) => {
      const movementRefs = normalized.map(() => doc(collection(db, "stockMovements")));
      const itemRefs = normalized.map((line) => doc(db, "inventoryItems", line.inventoryItemId!));
      const itemSnaps = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));

      normalized.forEach((line, index) => {
        const itemSnap = itemSnaps[index];
        if (!itemSnap.exists()) throw new Error(`Inventory item not found: ${line.label}`);

        const current = itemSnap.data() as any;
        const currentBags = toNum(current.availableBags);
        const currentKg = toNum(current.availableKg);
        const currentReservedBags = toNum(current.reservedBags);
        const currentReservedKg = toNum(current.reservedKg);
        const kg = line.bags * line.bagKg;

        if (line.bags > currentBags || kg > currentKg) {
          throw new Error(`Not enough stock available for ${line.label}.`);
        }

        if (releaseReserved && (line.bags > currentReservedBags || kg > currentReservedKg)) {
          throw new Error(`Not enough reserved stock available for ${line.label}.`);
        }

        const nextBreakdown = applyBagDelta(current.bagBreakdown, line.bagKg, -line.bags);

        transaction.update(itemRefs[index], {
          availableBags: Math.max(0, currentBags - line.bags),
          availableKg: Math.max(0, currentKg - kg),
          bagBreakdown: nextBreakdown,
          ...(releaseReserved
            ? {
                reservedBags: increment(-line.bags),
                reservedKg: increment(-kg),
              }
            : {}),
          updatedAt: serverTimestamp(),
        });

        transaction.set(movementRefs[index], {
          inventoryItemId: line.inventoryItemId,
          type: movementType,
          quantityBags: -line.bags,
          quantityKg: -kg,
          bagSizeKg: line.bagKg,
          sourceType,
          sourceId,
          label: line.label,
          createdBy: createdBy || null,
          createdByEmail: createdByEmail || null,
          createdAt: serverTimestamp(),
        });
      });
    });

    await writeAuditLog({
      action: "inventory_stock_out",
      status: "success",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized, movementType, releaseReserved },
    });
  } catch (error) {
    await writeAuditLog({
      action: "inventory_stock_out",
      level: "error",
      status: "failed",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized, movementType, releaseReserved },
      error,
    });
    throw error;
  }
};

export const reverseInventoryOutForSource = async ({
  sourceType,
  sourceId,
  lines,
  restoreReserved = false,
  createdBy,
  createdByEmail,
}: {
  sourceType: "order";
  sourceId: string;
  lines: InventoryStockLine[];
  restoreReserved?: boolean;
  createdBy?: string | null;
  createdByEmail?: string | null;
}) => {
  const normalized = normalizeLines(lines);
  if (!normalized.length) return;
  assertLinesHaveIds(normalized);

  const db = getFirestore();
  try {
    await runTransaction(db, async (transaction) => {
      const movementRefs = normalized.map(() => doc(collection(db, "stockMovements")));
      const itemRefs = normalized.map((line) => doc(db, "inventoryItems", line.inventoryItemId!));
      const itemSnaps = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));

      normalized.forEach((line, index) => {
        const itemSnap = itemSnaps[index];
        if (!itemSnap.exists()) throw new Error(`Inventory item not found: ${line.label}`);

        const current = itemSnap.data() as any;
        const kg = line.bags * line.bagKg;
        const nextBreakdown = applyBagDelta(current.bagBreakdown, line.bagKg, line.bags);

        transaction.update(itemRefs[index], {
          availableBags: increment(line.bags),
          availableKg: increment(kg),
          bagBreakdown: nextBreakdown,
          ...(restoreReserved
            ? {
                reservedBags: increment(line.bags),
                reservedKg: increment(kg),
              }
            : {}),
          updatedAt: serverTimestamp(),
        });

        transaction.set(movementRefs[index], {
          inventoryItemId: line.inventoryItemId,
          type: "order_reversal",
          quantityBags: line.bags,
          quantityKg: kg,
          bagSizeKg: line.bagKg,
          sourceType,
          sourceId,
          label: line.label,
          createdBy: createdBy || null,
          createdByEmail: createdByEmail || null,
          createdAt: serverTimestamp(),
        });
      });
    });

    await writeAuditLog({
      action: "inventory_stock_reverse",
      status: "success",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized, restoreReserved },
    });
  } catch (error) {
    await writeAuditLog({
      action: "inventory_stock_reverse",
      level: "error",
      status: "failed",
      actor: { uid: createdBy || null, email: createdByEmail || null },
      targetType: sourceType,
      targetId: sourceId,
      context: { lines: normalized, restoreReserved },
      error,
    });
    throw error;
  }
};
