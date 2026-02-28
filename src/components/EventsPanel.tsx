import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faLocationDot,
  faStar,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

type EventStatus = "draft" | "published" | "cancelled";

type CompanyEventDoc = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;

  startAt?: any; // Timestamp
  endAt?: any | null;

  isAllDay?: boolean | null;
  startDate?: string | null; // "YYYY-MM-DD"
  endDate?: string | null;

  tag?: string | null;

  status: EventStatus;
  isPinned?: boolean | null;

  createdAt?: any;
  updatedAt?: any;
};

// const statusBadge: Record<EventStatus, string> = {
//   draft: "bg-gray-100 text-gray-700 border-gray-200",
//   published: "bg-green-100 text-green-700 border-green-200",
//   cancelled: "bg-red-100 text-red-700 border-red-200",
// };

// const statusLabel: Record<EventStatus, string> = {
//   draft: "Draft",
//   published: "Published",
//   cancelled: "Cancelled",
// };

const isEventStatus = (v: any): v is EventStatus =>
  v === "draft" || v === "published" || v === "cancelled";

const safeStr = (v: any) => (v == null ? "" : String(v));

const tsToDate = (t: any): Date | null => {
  try {
    if (!t) return null;
    if (t instanceof Timestamp) return t.toDate();
    if (t?.toDate) return t.toDate();
    const s = t.seconds ?? t._seconds;
    if (typeof s !== "number") return null;
    return new Date(s * 1000);
  } catch {
    return null;
  }
};

const parseISODate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
};

const formatDateOnly = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const formatDateTime = (d: Date) =>
  d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const monthChip = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short" }).toUpperCase();

const clampText = (s: string, max = 90) =>
  s.length > max ? s.slice(0, max).trimEnd() + "…" : s;

const getEventDates = (ev: CompanyEventDoc) => {
  const allDay = !!ev.isAllDay;
  if (allDay) {
    const sd = parseISODate(ev.startDate);
    const ed = parseISODate(ev.endDate);
    return { isAllDay: true, start: sd, end: ed };
  }
  const s = tsToDate(ev.startAt);
  const e = tsToDate(ev.endAt);
  return { isAllDay: false, start: s, end: e };
};

const formatEventRange = (ev: CompanyEventDoc) => {
  const { isAllDay, start, end } = getEventDates(ev);
  if (!start) return "—";

  if (isAllDay) {
    if (end) return `${formatDateOnly(start)} → ${formatDateOnly(end)}`;
    return `${formatDateOnly(start)} (all day)`;
  }

  if (end) return `${formatDateTime(start)} → ${formatDateTime(end)}`;
  return formatDateTime(start);
};

type Props = {
  limit?: number; // default 5
  title?: string;
  subtitle?: string;
};

const EventsPanel: React.FC<Props> = ({
  limit = 5,
  title = "Events & notes",
  subtitle = "Seasonal updates & reminders.",
}) => {
  const db = getFirestore();
  const auth = getAuth();

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [events, setEvents] = useState<CompanyEventDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // asegura que el panel espere auth (para cumplir tus rules)
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  const fetchEvents = async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      // SIN where => no índice compuesto
      const q = query(collection(db, "companyEvents"), orderBy("startAt", "asc"));
      const snap = await getDocs(q);

      const list: CompanyEventDoc[] = snap.docs.map((d) => {
        const raw = d.data() as any;
        const status: EventStatus = isEventStatus(raw.status) ? raw.status : "draft";

        return {
          id: d.id,
          title: raw.title ?? "",
          description: raw.description ?? null,
          location: raw.location ?? null,
          startAt: raw.startAt ?? null,
          endAt: raw.endAt ?? null,
          isAllDay: raw.isAllDay ?? false,
          startDate: raw.startDate ?? null,
          endDate: raw.endDate ?? null,
          tag: raw.tag ?? null,
          isPinned: raw.isPinned ?? false,
          status,
          createdAt: raw.createdAt ?? null,
          updatedAt: raw.updatedAt ?? null,
        };
      });

      setEvents(list);
    } catch (e: any) {
      console.error("Error loading companyEvents:", e);
      setEvents([]);
      setErrorMsg(e?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // si no hay sesión, NO consultes (tus rules lo bloquean)
    if (!user) {
      setEvents([]);
      return;
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

    const computed = useMemo(() => {
    const now = new Date();

    // “today” sin hora (00:00)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const normalized = events
        .map((e) => {
        const { start, isAllDay } = getEventDates(e);

        let isPast = false;

        if (start) {
            if (isAllDay) {
            // ✅ all-day: past SOLO si es antes de hoy
            const d0 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            isPast = d0.getTime() < today.getTime();
            } else {
            // ✅ timed: past por hora
            isPast = start.getTime() < now.getTime();
            }
        }

        return { ...e, _start: start, _isPast: isPast };
        })
        .filter((e) => !!e._start)
        .filter((e) => e.status === "published")
        .filter((e) => e.status !== "cancelled");

    const upcoming = normalized
        .filter((e) => !e._isPast)
        .sort((a, b) => (a._start!.getTime() - b._start!.getTime()));

    // pinned primero (solo dentro de upcoming)
    const pinned = upcoming.filter((e) => !!e.isPinned);
    const rest = upcoming.filter((e) => !e.isPinned);

    const merged = [...pinned, ...rest];

    return {
        all: merged,
        top: merged.slice(0, limit),
        remaining: merged.slice(limit),
        total: merged.length,
    };
    }, [events, limit]);


  const EventCard = ({ ev }: { ev: CompanyEventDoc & { _isPast?: boolean; _start?: Date | null } }) => {
    const { start, isAllDay } = getEventDates(ev);
    const chip = start ? monthChip(start) : "—";

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm
                   px-4 py-3 flex items-start sm:items-center justify-between gap-3
                   hover:border-gray-300 transition"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 flex-shrink-0">
            <div className="text-[11px] font-semibold text-gray-500 tracking-wide">
              {chip}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {ev.title}
              </p>

              {ev.isPinned ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded-full border bg-yellow-50 border-yellow-200 text-yellow-700 uppercase tracking-wide">
                  <FontAwesomeIcon icon={faStar} />
                  pinned
                </span>
              ) : null}

              {/* <span
                className={[
                  "text-[10px] px-2 py-[2px] rounded-full border uppercase tracking-wide",
                  statusBadge[ev.status],
                ].join(" ")}
              >
                {statusLabel[ev.status]}
              </span> */}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon
                  icon={isAllDay ? faCalendarDays : faClock}
                  className="text-gray-400"
                />
                {formatEventRange(ev)}
              </span>

              {ev.location ? (
                <span className="inline-flex items-center gap-1">
                  <FontAwesomeIcon icon={faLocationDot} className="text-gray-400" />
                  {safeStr(ev.location)}
                </span>
              ) : null}
            </div>

            {ev.description ? (
              <p className="mt-1 text-xs text-gray-700">
                {clampText(safeStr(ev.description), 90)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-[#044421]/10 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[#044421]/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#044421]/10 shrink-0">
              <FontAwesomeIcon icon={faCalendarDays} className="text-[#044421] text-sm" />
            </span>

            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight">{title}</p>
              <p className="text-[11px] text-[#044421]/60 leading-snug mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#044421]/10 text-[#044421] font-medium shrink-0">
            {loading ? "Loading…" : `${computed.total} total`}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {!user ? (
          <div className="rounded-xl border border-[#044421]/10 bg-[#f6faf7] p-3">
            <p className="text-sm font-semibold text-[#044421]">Sign in required</p>
            <p className="text-xs text-[#044421]/70 mt-1">
              You must be signed in to view events.
            </p>
          </div>
        ) : errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-700">Could not load events</p>
            <p className="text-xs text-red-700/80 mt-1 break-words">{errorMsg}</p>
          </div>
        ) : loading ? (
          <div className="text-sm text-gray-500 italic">Loading…</div>
        ) : computed.top.length === 0 ? (
          <div className="rounded-xl border border-[#044421]/10 bg-[#f6faf7] p-3">
            <p className="text-sm font-semibold text-[#044421]">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {computed.top.map((ev) => (
              <EventCard key={ev.id} ev={ev as any} />
            ))}

            {computed.remaining.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50
                             text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <span>
                    {expanded ? "Hide" : "Show"} {computed.remaining.length} more
                  </span>
                  <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
                </button>

                {expanded && (
                  <div className="mt-2 space-y-2">
                    {computed.remaining.map((ev) => (
                      <EventCard key={ev.id} ev={ev as any} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPanel;
