import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";

type AuditLevel = "info" | "warning" | "error";
type AuditStatus = "started" | "success" | "failed";

type AuditActor = {
  uid?: string | null;
  email?: string | null;
};

type AuditError = {
  message?: string;
  name?: string;
  code?: string;
  stack?: string;
};

type AuditLogInput = {
  action: string;
  level?: AuditLevel;
  status?: AuditStatus;
  actor?: AuditActor;
  targetType?: string;
  targetId?: string | null;
  targetLabel?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  error?: unknown;
};

const cleanValue = (value: unknown, depth = 0): unknown => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (depth > 5) return "[Max depth]";

  if (Array.isArray(value)) {
    return value.map((item) => cleanValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        cleanValue(item, depth + 1),
      ])
    );
  }

  return String(value);
};

export const serializeAuditError = (error: unknown): AuditError => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    const data = error as Record<string, unknown>;
    return {
      name: String(data.name || "Error"),
      message: String(data.message || JSON.stringify(cleanValue(data))),
      code: data.code ? String(data.code) : undefined,
      stack: data.stack ? String(data.stack) : undefined,
    };
  }

  return { message: String(error) };
};

export const auditErrorMessage = (error: unknown, fallback = "Unexpected error") => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

export const writeAuditLog = async ({
  action,
  level = "info",
  status = "success",
  actor,
  targetType,
  targetId,
  targetLabel,
  before,
  after,
  context,
  error,
}: AuditLogInput) => {
  try {
    const db = getFirestore();
    await addDoc(collection(db, "systemLogs"), {
      action,
      level,
      status,
      actorUid: actor?.uid || null,
      actorEmail: actor?.email || null,
      targetType: targetType || null,
      targetId: targetId || null,
      targetLabel: targetLabel || null,
      before: cleanValue(before || null),
      after: cleanValue(after || null),
      context: cleanValue(context || null),
      error: error ? cleanValue(serializeAuditError(error)) : null,
      createdAt: serverTimestamp(),
    });
  } catch (logError) {
    console.error("Audit log write failed:", logError);
  }
};
