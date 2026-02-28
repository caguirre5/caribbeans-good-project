import React, { useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPen,
  faXmark,
  faCalendarDays,
  faLocationDot,
  faBullhorn,
  faStar,
  faClock,
  faTag,
  faPaperPlane,
  faBell,
} from "@fortawesome/free-solid-svg-icons";

type EventStatus = "draft" | "published" | "cancelled";

type CompanyEventDoc = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;

  // Timed events
  startAt?: any; // Timestamp
  endAt?: any | null; // Timestamp

  // All-day events
  isAllDay?: boolean | null;
  startDate?: string | null; // "YYYY-MM-DD"
  endDate?: string | null; // "YYYY-MM-DD" (optional)

  // UI tag badge
  tag?: string | null; // e.g. "Seasonal"

  status: EventStatus;
  isPinned?: boolean | null;
  createdAt?: any;
  updatedAt?: any;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const safeStr = (v: any) => (v == null ? "" : String(v));

const tsToDate = (t: any): Date | null => {
  try {
    if (!t) return null;
    const s = t.seconds ?? t._seconds;
    if (typeof s !== "number") return null;
    return new Date(s * 1000);
  } catch {
    return null;
  }
};

const toLocalDateTimeInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const fromLocalDateTimeInput = (v: string): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const todayDateInput = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

const parseISODate = (iso: string): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
};

const formatDateOnly = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

const formatDateTime = (d: Date) =>
  d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const clampText = (s: string, max = 120) =>
  s.length > max ? s.slice(0, max).trimEnd() + "…" : s;

const statusBadge: Record<EventStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  published: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabel: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
};

const monthChip = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short" }).toUpperCase();

const getEventDates = (ev: CompanyEventDoc) => {
  const isAllDay = !!ev.isAllDay;
  if (isAllDay) {
    const sd = ev.startDate ? parseISODate(ev.startDate) : null;
    const ed = ev.endDate ? parseISODate(ev.endDate) : null;
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

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diffDaysFromToday = (target: Date) => {
  const t0 = startOfDay(new Date()).getTime();
  const t1 = startOfDay(target).getTime();
  return Math.round((t1 - t0) / 86400000);
};

const getReminderLabel = (ev: CompanyEventDoc) => {
  const { start } = getEventDates(ev);
  if (!start) return "soon";
  const dd = diffDaysFromToday(start);

  if (dd === 0) return "today";
  if (dd === 1) return "tomorrow";
  if (dd > 1) return `in ${dd} days`;
  if (dd === -1) return "started yesterday";
  return "already started";
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const toParagraphHtml = (s: string) => {
  const trimmed = safeStr(s).trim();
  if (!trimmed) return "";
  // preserve line breaks from admins
  return escapeHtml(trimmed).replace(/\n/g, "<br/>");
};

// ──────────────────────────────────────────────────────────────
// Email builders (admins edit subject + short message; HTML stays internal)
// ──────────────────────────────────────────────────────────────
const buildEmailShellHTML = (opts: {
  title: string;
  subtitle?: string;
  bodyHTML: string;
  footerNote?: string;
}) => {
  const subtitleRow = opts.subtitle
    ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">${escapeHtml(
        opts.subtitle
      )}</p>`
    : "";

  const footerNote = opts.footerNote
    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a8f98;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
        opts.footerNote
      )}</p>`
    : "";

  return `
<html>
  <body style="margin:0;padding:0;background:#f6f8fa;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fa;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #eaecef;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
            <tr>
              <td style="padding:20px 24px 12px;">
                <h1 style="margin:0;font-size:18px;line-height:1.3;color:#111;">${escapeHtml(
                  opts.title
                )}</h1>
                ${subtitleRow}
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px;">
                <div style="height:1px;background:#eaecef;"></div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 6px;">
                ${opts.bodyHTML}
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px 20px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">— Caribbean Goods Team</p>
              </td>
            </tr>
          </table>

          ${footerNote}
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
};

const buildEventBlocksHTML = (ev: CompanyEventDoc, extraMessage?: string) => {
  const when = formatEventRange(ev);
  const location = safeStr(ev.location).trim();
  const desc = safeStr(ev.description).trim();
  const tag = safeStr(ev.tag).trim();
  const extra = toParagraphHtml(extraMessage || "");

  const extraRow = extra
    ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#444;">${extra}</p>`
    : "";

  const locationRow = location
    ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;"><b>Location:</b> ${escapeHtml(
        location
      )}</p>`
    : "";

  const tagRow = tag
    ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;"><b>Tag:</b> ${escapeHtml(
        tag
      )}</p>`
    : "";

  const descRow = desc
    ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">${escapeHtml(
        desc
      )}</p>`
    : "";

  return `
${extraRow}

<p style="margin:0 0 10px;font-size:16px;line-height:1.5;color:#111;">
  <b>${escapeHtml(safeStr(ev.title))}</b>
</p>

<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">
  <b>When:</b> ${escapeHtml(when)}
</p>

${locationRow}
${tagRow}
${descRow}
`.trim();
};

const buildPublishedEmailHTML = (ev: CompanyEventDoc, adminMessage?: string) => {
  const bodyHTML = buildEventBlocksHTML(ev, adminMessage);
  return buildEmailShellHTML({
    title: "New event published",
    subtitle: "A new event has been published in the dashboard:",
    bodyHTML,
    footerNote: `This message was sent because "${safeStr(ev.title)}" was published.`,
  });
};

const buildReminderEmailHTML = (ev: CompanyEventDoc, adminMessage?: string) => {
  const label = getReminderLabel(ev); // today / tomorrow / in X days
  const bodyHTML = buildEventBlocksHTML(ev, adminMessage);

  const title =
    label === "today"
      ? "Event reminder (today)"
      : label === "tomorrow"
      ? "Event reminder (tomorrow)"
      : label.startsWith("in ")
      ? `Event reminder (${label})`
      : "Event reminder";

  const subtitle =
    label === "today"
      ? "Quick reminder — this event is happening today:"
      : label === "tomorrow"
      ? "Quick reminder — this event is happening tomorrow:"
      : label.startsWith("in ")
      ? `Quick reminder — this event is happening ${label}:`
      : "Quick reminder — this event is coming up:";

  return buildEmailShellHTML({
    title,
    subtitle,
    bodyHTML,
    footerNote: `This message was sent as a reminder for "${safeStr(ev.title)}".`,
  });
};

const EventsManager: React.FC = () => {
  const db = getFirestore();

  const [events, setEvents] = useState<CompanyEventDoc[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // create / edit
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [tag, setTag] = useState("");

  // status (only editable in edit mode)
  const [status, setStatus] = useState<EventStatus>("draft");
  const [isPinned, setIsPinned] = useState(false);

  // all day toggle + inputs
  const [isAllDay, setIsAllDay] = useState(false);

  // timed inputs
  const [startAt, setStartAt] = useState(() => toLocalDateTimeInput(new Date()));
  const [endAt, setEndAt] = useState("");

  // all-day inputs
  const [startDate, setStartDate] = useState(() => todayDateInput());
  const [endDate, setEndDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // edit mode
  const [editing, setEditing] = useState<CompanyEventDoc | null>(null);

  // delete confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CompanyEventDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // PUBLISH MODAL (no HTML shown)
  // ──────────────────────────────────────────────────────────────
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishFor, setPublishFor] = useState<CompanyEventDoc | null>(null);
  const [publishSubject, setPublishSubject] = useState("");
  const [publishMessage, setPublishMessage] = useState(""); // editable plain text
  const [publishSending, setPublishSending] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const publishHTML = useMemo(() => {
    if (!publishFor) return "";
    return buildPublishedEmailHTML(publishFor, publishMessage);
  }, [publishFor, publishMessage]);

  // ──────────────────────────────────────────────────────────────
  // REMINDER MODAL (published events)
  // ──────────────────────────────────────────────────────────────
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderFor, setReminderFor] = useState<CompanyEventDoc | null>(null);
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const reminderHTML = useMemo(() => {
    if (!reminderFor) return "";
    return buildReminderEmailHTML(reminderFor, reminderMessage);
  }, [reminderFor, reminderMessage]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setTag("");

    // create default: draft
    setStatus("draft");
    setIsPinned(false);

    setIsAllDay(false);
    setStartAt(toLocalDateTimeInput(new Date()));
    setEndAt("");
    setStartDate(todayDateInput());
    setEndDate("");

    setFormError(null);
    setEditing(null);
  };

  const fetchEvents = async () => {
    try {
      setLoadingList(true);
      const q = query(collection(db, "companyEvents"), orderBy("startAt", "desc"));
      const snap = await getDocs(q);
      const list: CompanyEventDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setEvents(list);
    } catch (e) {
      console.error("Error loading events:", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (confirmOpen || publishOpen || reminderOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [confirmOpen, publishOpen, reminderOpen]);

  const computed = useMemo(() => {
    const now = new Date();

    const withDates = events.map((e) => {
      const { start } = getEventDates(e);
      const isPast = start ? start.getTime() < now.getTime() : false;
      return { ...e, _isPast: isPast };
    });

    const pinned = withDates
      .filter((e) => !!e.isPinned && e.status !== "cancelled")
      .sort((a, b) => {
        const sa = getEventDates(a).start?.getTime() ?? 0;
        const sb = getEventDates(b).start?.getTime() ?? 0;
        return sb - sa;
      });

    const upcoming = withDates
      .filter((e) => e.status !== "cancelled")
      .sort((a, b) => {
        const sa = getEventDates(a).start?.getTime() ?? 0;
        const sb = getEventDates(b).start?.getTime() ?? 0;
        return sa - sb;
      });

    const publishedCount = events.filter((e) => e.status === "published").length;
    const draftCount = events.filter((e) => e.status === "draft").length;
    const cancelledCount = events.filter((e) => e.status === "cancelled").length;

    return { pinned, upcoming, publishedCount, draftCount, cancelledCount };
  }, [events]);

  const startDateObjTimed = useMemo(() => fromLocalDateTimeInput(startAt), [startAt]);
  const endDateObjTimed = useMemo(() => fromLocalDateTimeInput(endAt), [endAt]);
  const startDateObjAllDay = useMemo(() => (startDate ? parseISODate(startDate) : null), [startDate]);
  const endDateObjAllDay = useMemo(() => (endDate ? parseISODate(endDate) : null), [endDate]);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;

    if (isAllDay) {
      if (!startDate) return false;
      if (
        endDateObjAllDay &&
        startDateObjAllDay &&
        endDateObjAllDay.getTime() < startDateObjAllDay.getTime()
      )
        return false;
      return true;
    }

    if (!startDateObjTimed) return false;
    if (endDateObjTimed && startDateObjTimed && endDateObjTimed.getTime() < startDateObjTimed.getTime())
      return false;
    return true;
  }, [
    title,
    isAllDay,
    startDate,
    startDateObjAllDay,
    endDateObjAllDay,
    startDateObjTimed,
    endDateObjTimed,
  ]);

  const loadEventIntoForm = (ev: CompanyEventDoc) => {
    setEditing(ev);
    setTitle(ev.title ?? "");
    setDescription((ev.description as any) ?? "");
    setLocation((ev.location as any) ?? "");
    setTag((ev.tag as any) ?? "");
    setStatus((ev.status as EventStatus) ?? "draft");
    setIsPinned(!!ev.isPinned);

    const allDay = !!ev.isAllDay;
    setIsAllDay(allDay);

    if (allDay) {
      setStartDate(ev.startDate ? String(ev.startDate) : todayDateInput());
      setEndDate(ev.endDate ? String(ev.endDate) : "");
      setStartAt(toLocalDateTimeInput(new Date()));
      setEndAt("");
    } else {
      const s = tsToDate(ev.startAt) ?? new Date();
      setStartAt(toLocalDateTimeInput(s));
      const en = tsToDate(ev.endAt);
      setEndAt(en ? toLocalDateTimeInput(en) : "");
      setStartDate(todayDateInput());
      setEndDate("");
    }

    setFormError(null);
    window?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setFormError(null);

    const t = title.trim();
    if (!t) return setFormError("Title is required.");

    // If not editing: always draft
    const effectiveStatus: EventStatus = editing ? status : "draft";

    let payload: any = {
      title: t,
      description: description.trim() || null,
      location: location.trim() || null,
      tag: tag.trim() || null,
      status: effectiveStatus,
      isPinned: !!isPinned,
      isAllDay: !!isAllDay,
      updatedAt: serverTimestamp(),
    };

    if (isAllDay) {
      if (!startDate) return setFormError("Start date is required.");
      const sd = parseISODate(startDate);
      const ed = endDate ? parseISODate(endDate) : null;
      if (!sd) return setFormError("Start date is invalid.");
      if (ed && ed.getTime() < sd.getTime())
        return setFormError("End date cannot be earlier than start date.");

      const sortTs = Timestamp.fromDate(new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), 0, 0, 0));

      payload = {
        ...payload,
        startDate,
        endDate: endDate || null,
        startAt: sortTs,
        endAt: null,
      };
    } else {
      const s = fromLocalDateTimeInput(startAt);
      const en = fromLocalDateTimeInput(endAt);
      if (!s) return setFormError("Start date/time is required.");
      if (en && en.getTime() < s.getTime())
        return setFormError("End date/time cannot be earlier than start date/time.");

      payload = {
        ...payload,
        startDate: null,
        endDate: null,
        startAt: Timestamp.fromDate(s),
        endAt: en ? Timestamp.fromDate(en) : null,
      };
    }

    try {
      setSubmitting(true);

      if (editing) {
        await updateDoc(doc(db, "companyEvents", editing.id), payload);
      } else {
        await addDoc(collection(db, "companyEvents"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      fetchEvents();
    } catch (e) {
      console.error("Error saving event:", e);
      alert("Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, "companyEvents", toDelete.id));
      setConfirmOpen(false);
      setToDelete(null);
      fetchEvents();
    } catch (e) {
      console.error("Error deleting event:", e);
    } finally {
      setDeleting(false);
    }
  };

  const sendBulkEmail = async (payload: { subject: string; html: string }) => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();

    const base = import.meta.env.VITE_FULL_ENDPOINT;
    if (!base) throw new Error("Missing VITE_FULL_ENDPOINT");

    const res = await fetch(`${base}/email/sendCustomEmailToAllUsers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || "Bulk send failed");
    }

    return res.json().catch(() => null);
  };

  // ──────────────────────────────────────────────────────────────
  // Publish from list
  // ──────────────────────────────────────────────────────────────
  const openPublish = (ev: CompanyEventDoc) => {
    setPublishFor(ev);
    setPublishSubject(`New event published: ${safeStr(ev.title)}`);
    setPublishMessage("");
    setPublishError(null);
    setPublishOpen(true);
  };

  const confirmPublishAndSend = async () => {
    if (!publishFor) return;

    setPublishSending(true);
    setPublishError(null);

    try {
      // 1) Send email
      await sendBulkEmail({
        subject: publishSubject || `New event published: ${safeStr(publishFor.title)}`,
        html: publishHTML,
      });

      // 2) Mark published
      await updateDoc(doc(db, "companyEvents", publishFor.id), {
        status: "published",
        updatedAt: serverTimestamp(),
      });

      setPublishOpen(false);
      setPublishFor(null);
      fetchEvents();
    } catch (e: any) {
      console.error(e);
      setPublishError(e?.message || "Failed to publish / send email.");
    } finally {
      setPublishSending(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Reminder for published
  // ──────────────────────────────────────────────────────────────
  const openReminder = (ev: CompanyEventDoc) => {
    const label = getReminderLabel(ev);
    const subject =
      label === "today"
        ? `Reminder: ${safeStr(ev.title)} is today`
        : label === "tomorrow"
        ? `Reminder: ${safeStr(ev.title)} is tomorrow`
        : label.startsWith("in ")
        ? `Reminder: ${safeStr(ev.title)} happens ${label}`
        : `Reminder: ${safeStr(ev.title)}`;

    setReminderFor(ev);
    setReminderSubject(subject);
    setReminderMessage("");
    setReminderError(null);
    setReminderOpen(true);
  };

  const confirmReminderSend = async () => {
    if (!reminderFor) return;

    setReminderSending(true);
    setReminderError(null);

    try {
      await sendBulkEmail({
        subject: reminderSubject || `Reminder: ${safeStr(reminderFor.title)}`,
        html: reminderHTML,
      });

      setReminderOpen(false);
      setReminderFor(null);
    } catch (e: any) {
      console.error(e);
      setReminderError(e?.message || "Failed to send reminder.");
    } finally {
      setReminderSending(false);
    }
  };

  const EventCard = ({ ev }: { ev: CompanyEventDoc & { _isPast?: boolean } }) => {
    const { start, isAllDay: evAllDay } = getEventDates(ev);
    const chip = start ? monthChip(start) : "—";

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm
                   px-4 py-3 flex items-start sm:items-center justify-between gap-3
                   hover:border-gray-300 transition"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 flex-shrink-0">
            <div className="text-[11px] font-semibold text-gray-500 tracking-wide">{chip}</div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>

              {ev.isPinned ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded-full border bg-yellow-50 border-yellow-200 text-yellow-700 uppercase tracking-wide">
                  <FontAwesomeIcon icon={faStar} />
                  pinned
                </span>
              ) : null}

              {ev._isPast ? (
                <span className="inline text-[10px] px-2 py-[2px] rounded-full border bg-gray-50 border-gray-200 text-gray-600 uppercase tracking-wide">
                  past
                </span>
              ) : null}

              <span
                className={[
                  "text-[10px] px-2 py-[2px] rounded-full border uppercase tracking-wide",
                  statusBadge[ev.status],
                ].join(" ")}
              >
                {statusLabel[ev.status]}
              </span>

              {safeStr(ev.tag).trim() ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded-full border bg-green-50 border-green-200 text-green-700 uppercase tracking-wide">
                  <FontAwesomeIcon icon={faTag} />
                  {safeStr(ev.tag)}
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1">
                <FontAwesomeIcon icon={evAllDay ? faCalendarDays : faClock} className="text-gray-400" />
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
              <p className="mt-1 text-xs text-gray-700">{clampText(safeStr(ev.description), 90)}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Publish button only when DRAFT */}
          {ev.status === "draft" ? (
            <button
              type="button"
              onClick={() => openPublish(ev)}
              className="h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-green-50 hover:border-green-200
                         inline-flex items-center justify-center"
              title="Publish & notify users"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-green-700" />
            </button>
          ) : null}

          {/* Reminder button only when PUBLISHED */}
          {ev.status === "published" ? (
            <button
              type="button"
              onClick={() => openReminder(ev)}
              className="h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200
                         inline-flex items-center justify-center"
              title="Send reminder email"
            >
              <FontAwesomeIcon icon={faBell} className="text-blue-700" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => loadEventIntoForm(ev)}
            className="h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50
                       inline-flex items-center justify-center"
            title="Edit event"
          >
            <FontAwesomeIcon icon={faPen} className="text-gray-700" />
          </button>

          <button
            type="button"
            onClick={() => {
              setToDelete(ev);
              setConfirmOpen(true);
            }}
            className="h-9 w-9 rounded-lg border border-gray-200
                       bg-white hover:bg-red-50 hover:border-red-200
                       inline-flex items-center justify-center"
            title="Delete event"
          >
            <FontAwesomeIcon icon={faTrash} className="text-red-600" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* CREATE / EDIT CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faBullhorn} className="text-gray-700" />
              <span>{editing ? "Edit event" : "Create event"}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Create announcements / activities that show in the dashboard.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full border bg-green-50 border-green-200 text-green-700">
                {computed.publishedCount} published
              </span>
              <span className="px-2 py-1 rounded-full border bg-gray-50 border-gray-200 text-gray-700">
                {computed.draftCount} draft
              </span>
              <span className="px-2 py-1 rounded-full border bg-red-50 border-red-200 text-red-700">
                {computed.cancelledCount} cancelled
              </span>
            </div>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50
                           text-sm inline-flex items-center gap-2"
                disabled={submitting}
                title="Cancel editing"
              >
                <FontAwesomeIcon icon={faXmark} />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* FORM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Title */}
          <div className="lg:col-span-6">
            <label className="text-xs font-semibold text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Coffee Fair"'
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
            />
          </div>

          {/* Status: only editable in edit mode */}
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Status</label>

            {!editing ? (
              <div className="mt-1 h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm flex items-center text-gray-600">
                Draft
              </div>
            ) : (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>

          {/* Pinned */}
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Pinned</label>
            <button
              type="button"
              onClick={() => setIsPinned((p) => !p)}
              className={[
                "mt-1 w-full h-10 rounded-lg border text-sm inline-flex items-center justify-center gap-2 transition",
                isPinned
                  ? "bg-[#044421] text-white border-[#044421] hover:bg-[#06603a]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
              ].join(" ")}
              title="Pinned events appear at the top of the dashboard"
            >
              <FontAwesomeIcon icon={faStar} />
              <span>{isPinned ? "Pinned" : "Not pinned"}</span>
            </button>
          </div>

          {/* Tag */}
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-gray-700">Tag (optional)</label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder='e.g. "Seasonal", "Internal"'
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
            />
          </div>

          {/* Time toggle */}
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-gray-700">Time</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAllDay(true)}
                className={[
                  "h-10 rounded-lg border text-sm font-medium transition inline-flex items-center justify-center gap-2",
                  isAllDay
                    ? "bg-[#044421] text-white border-[#044421] hover:bg-[#06603a]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={faCalendarDays} />
                All-day
              </button>

              <button
                type="button"
                onClick={() => setIsAllDay(false)}
                className={[
                  "h-10 rounded-lg border text-sm font-medium transition inline-flex items-center justify-center gap-2",
                  !isAllDay
                    ? "bg-[#044421] text-white border-[#044421] hover:bg-[#06603a]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={faClock} />
                Timed
              </button>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Create as <b>Draft</b>, then publish from the list when ready.
            </p>
          </div>

          {/* Date */}
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-gray-700">{isAllDay ? "Date range" : "Date & time"}</label>

            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {isAllDay ? (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                    title="Start date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                    title="End date (optional)"
                  />
                </>
              ) : (
                <>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                    title="Start"
                  />
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                    title="End (optional)"
                  />
                </>
              )}
            </div>

            {isAllDay ? (
              endDateObjAllDay && startDateObjAllDay && endDateObjAllDay.getTime() < startDateObjAllDay.getTime() ? (
                <p className="text-[11px] text-red-600 mt-1">End date cannot be earlier than start date.</p>
              ) : null
            ) : endDateObjTimed && startDateObjTimed && endDateObjTimed.getTime() < startDateObjTimed.getTime() ? (
              <p className="text-[11px] text-red-600 mt-1">End cannot be earlier than start.</p>
            ) : null}
          </div>

          {/* Location */}
          <div className="lg:col-span-12">
            <label className="text-xs font-semibold text-gray-700">
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-gray-500" />
                Location (optional)
              </span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='e.g. "Glasgow HQ"'
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
            />
          </div>

          {/* Description */}
          <div className="lg:col-span-12">
            <label className="text-xs font-semibold text-gray-700">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short description…"
              className="mt-1 w-full min-h-[90px] rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>Tip: Draft first, then publish from the list.</span>
              <span>{description.length}/500</span>
            </div>
          </div>
        </div>

        {formError && (
          <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {formError}
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-gray-500">
            {editing ? (
              <span>
                Editing: <b className="text-gray-800">{editing.title}</b>
              </span>
            ) : (
              <span>
                New events are created as <b>Draft</b>. Publish from the list when ready.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={[
              "h-10 px-4 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2",
              "border transition w-full sm:w-auto",
              !canSubmit || submitting
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-[#044421] text-white border-[#044421] hover:bg-[#06603a]",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{submitting ? "Saving…" : editing ? "Save changes" : "Create draft"}</span>
          </button>
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Current events</h3>
          <span className="text-xs text-gray-500">{loadingList ? "Loading…" : `${events.length} total`}</span>
        </div>

        {events.length === 0 && !loadingList ? (
          <div className="text-sm text-gray-500 italic">No events created yet.</div>
        ) : (
          <div className="space-y-2">
            {computed.pinned.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <FontAwesomeIcon icon={faStar} className="text-gray-600" />
                    Pinned
                  </div>
                  <span className="text-xs text-gray-500">{computed.pinned.length}</span>
                </div>

                <div className="p-3 space-y-2">
                  {computed.pinned.slice(0, 6).map((ev) => (
                    <EventCard key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-700">All events</div>
                <div className="text-[11px] text-gray-500">
                  Drafts show <b>Publish</b>. Published shows a <b>Reminder</b> bell.
                </div>
              </div>

              <div className="p-3 space-y-2">
                {computed.upcoming.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}

                {computed.upcoming.length === 0 && (
                  <div className="px-1 py-6 text-sm text-gray-500 italic">No events found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PUBLISH MODAL */}
      {publishOpen && publishFor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPublishOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">Publish event</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Sends an email notification and marks the event as <b>Published</b>.
                </p>
              </div>
              <button
                onClick={() => setPublishOpen(false)}
                className="h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-700" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: inputs */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  <div className="font-semibold">{publishFor.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{formatEventRange(publishFor)}</div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Subject</label>
                  <input
                    value={publishSubject}
                    onChange={(e) => setPublishSubject(e.target.value)}
                    className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Optional message (shown at top)</label>
                  <textarea
                    value={publishMessage}
                    onChange={(e) => setPublishMessage(e.target.value)}
                    placeholder="Add a short note (optional)…"
                    className="mt-1 w-full min-h-[110px] rounded-lg border border-gray-300 px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                  />
                  <div className="mt-1 text-[11px] text-gray-500">
                    Tip: You can write normal text. Line breaks are preserved.
                  </div>
                </div>

                {publishError && (
                  <div className="text-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    {publishError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setPublishOpen(false)}
                    className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                    disabled={publishSending}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmPublishAndSend}
                    disabled={publishSending}
                    className={[
                      "h-10 px-4 rounded-lg text-sm font-medium text-white border border-[#044421] inline-flex items-center gap-2",
                      publishSending
                        ? "bg-[#044421] opacity-70 cursor-not-allowed"
                        : "bg-[#044421] hover:bg-[#06603a]",
                    ].join(" ")}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                    {publishSending ? "Publishing…" : "Publish & send email"}
                  </button>
                </div>
              </div>

              {/* Right: preview */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700">Preview</div>
                  <div className="text-[11px] text-gray-500">Admins don’t see HTML — this is the email view.</div>
                </div>

                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <div
                      className="p-0"
                      // HTML is generated by our template builder, not pasted by admins
                      dangerouslySetInnerHTML={{ __html: publishHTML }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REMINDER MODAL */}
      {reminderOpen && reminderFor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setReminderOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">Send reminder</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Sends a reminder email to users (filtered by backend).
                </p>
              </div>
              <button
                onClick={() => setReminderOpen(false)}
                className="h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-700" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left */}
              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  <div className="font-semibold">
                    {reminderFor.title}{" "}
                    <span className="ml-2 text-[11px] font-semibold px-2 py-[2px] rounded-full border bg-white text-gray-700">
                      {getReminderLabel(reminderFor)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{formatEventRange(reminderFor)}</div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Subject</label>
                  <input
                    value={reminderSubject}
                    onChange={(e) => setReminderSubject(e.target.value)}
                    className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Optional message (shown at top)</label>
                  <textarea
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="Add a short note (optional)…"
                    className="mt-1 w-full min-h-[110px] rounded-lg border border-gray-300 px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
                  />
                </div>

                {reminderError && (
                  <div className="text-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    {reminderError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setReminderOpen(false)}
                    className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50"
                    disabled={reminderSending}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmReminderSend}
                    disabled={reminderSending}
                    className={[
                      "h-10 px-4 rounded-lg text-sm font-medium text-white border border-[#044421] inline-flex items-center gap-2",
                      reminderSending
                        ? "bg-[#044421] opacity-70 cursor-not-allowed"
                        : "bg-[#044421] hover:bg-[#06603a]",
                    ].join(" ")}
                  >
                    <FontAwesomeIcon icon={faBell} />
                    {reminderSending ? "Sending…" : "Send reminder"}
                  </button>
                </div>
              </div>

              {/* Right: preview */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700">Preview</div>
                  <div className="text-[11px] text-gray-500">
                    “Today / Tomorrow / In X days” is auto-generated.
                  </div>
                </div>

                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    <div dangerouslySetInnerHTML={{ __html: reminderHTML }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b">
              <h3 className="text-base font-semibold text-gray-900">Delete event</h3>
              <p className="text-sm text-gray-600 mt-1">This will permanently remove the event from Firestore.</p>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-800">
                Are you sure you want to delete <span className="font-semibold">{toDelete?.title}</span>?
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-medium
                             hover:bg-red-700 disabled:bg-red-300"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsManager;