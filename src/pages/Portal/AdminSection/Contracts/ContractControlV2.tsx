import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faCalendarDays,
  faCheck,
  faChartColumn,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faRotateRight,
  faTableCellsLarge,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { collection, doc, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../../../contexts/AuthContext';

type State = 'planned' | 'due' | 'missed' | 'partial' | 'ok' | 'ahead' | 'open';
type RowStatus = 'on_track' | 'ahead' | 'behind' | 'due' | 'needs_extension';
type Selection = { variety?: string; farm?: string; bags?: unknown; bagKg?: unknown; lineKg?: unknown; remainingBags?: unknown; remainingKg?: unknown };
type Contract = { id: string; contractNo?: string | null; name?: string | null; email?: string | null; status?: string | null; createdAt?: unknown; details?: any; reservation?: any; selections?: Selection[] | null; dispatchHistory?: any[] | null };
type OrderItem = { bags?: number; bagKg?: number; lineKg?: number; sourceType?: string; contractId?: string; contractSelectionIndex?: number; varietyName?: string };
type Order = { id: string; status: string; createdAt: Date | null; preferredDeliveryDate?: Date | null; items: OrderItem[] };
type Actual = { fulfilledBags: number; fulfilledKg: number; openBags: number; openKg: number };
type Plan = { currentEndMonth?: string; expectedOverrides?: Record<string, Record<string, number>>; updatedAt?: string };
type Target = { expectedBags: number; expectedKg: number };
type Cell = Target & { key: string; label: string; actualBags: number; actualKg: number; openBags: number; openKg: number; state: State };
type VarietyRow = { selectionIndex: number; variety: string; totalBags: number; totalKg: number; remainingBags: number; remainingKg: number; fulfilledBags: number; fulfilledKg: number; bagKg: number; cells: Cell[] };
type ControlRow = { contract: Contract; contractNo: string; customer: string; startMonth: string; endMonth: string; originalEndMonth: string; periodLabel: string; status: RowStatus; totalBags: number; totalKg: number; remainingBags: number; remainingKg: number; fulfilledBags: number; fulfilledKg: number; completionPct: number; monthsLeft: number; baseBags: number; baseKg: number; currentBags: number; currentKg: number; nextBags: number; plannedToDateKg: number; balanceKg: number; openKg: number; varieties: VarietyRow[] };
type EditTarget = { contractId: string; contractNo: string; monthKey: string; monthLabel: string; selectionIndex: number; variety: string; currentBags: number };

const monthNumbers: Record<string, number> = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
const n = (value: unknown, fallback = 0): number => { if (typeof value === 'number' && Number.isFinite(value)) return value; if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); if (Number.isFinite(parsed)) return parsed; } return fallback; };
const roundBags = (value: unknown) => Math.max(0, Math.round(n(value)));
const toDate = (value: any): Date | null => { if (!value) return null; if (value instanceof Date) return value; if (typeof value === 'string' || typeof value === 'number') { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; } const seconds = value.seconds ?? value._seconds; return typeof seconds === 'number' ? new Date(seconds * 1000) : null; };
const monthKey = (date: Date | null) => date ? date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') : '';
const currentMonthKey = () => monthKey(new Date());
const monthFromParts = (month?: unknown, year?: unknown) => { const y = n(year); const m = monthNumbers[String(month || '').toLowerCase()] || n(month); return y && m ? y + '-' + String(m).padStart(2, '0') : ''; };
const addMonths = (key: string, amount: number) => { const parts = key.split('-').map(Number); const date = new Date(parts[0], parts[1] - 1 + amount, 1); return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'); };
const monthDiffInclusive = (start: string, end: string) => { const s = start.split('-').map(Number); const e = end.split('-').map(Number); return Math.max(0, (e[0] - s[0]) * 12 + (e[1] - s[1]) + 1); };
const monthsBetween = (start: string, end: string) => Array.from({ length: Math.min(monthDiffInclusive(start, end), 60) }, (_, index) => addMonths(start, index));
const maxMonth = (a: string, b: string) => a > b ? a : b;
const monthLabel = (key: string) => { const parts = key.split('-').map(Number); return new Date(parts[0], parts[1] - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); };
const labelNorm = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const selectionsOf = (contract: Contract): Selection[] => Array.isArray(contract.details?.selections) ? contract.details.selections : Array.isArray(contract.selections) ? contract.selections || [] : [];
const reservationOf = (contract: Contract) => contract.details?.reservation || contract.reservation || {};
const planOf = (contract: Contract): Plan => reservationOf(contract).controlPlan || {};
const selectionName = (selection: Selection, index: number) => String(selection.variety || selection.farm || 'Coffee ' + (index + 1)).trim();
const bagKgOf = (selection: Selection) => { const bags = n(selection.bags); const lineKg = n(selection.lineKg); return n(selection.bagKg, bags > 0 && lineKg > 0 ? lineKg / bags : 24); };
const originalPeriodOf = (contract: Contract) => { const reservation = reservationOf(contract); const created = monthKey(toDate(contract.createdAt)) || currentMonthKey(); const start = String(reservation.startMonth || '').trim() || monthFromParts(reservation.month1, reservation.year1) || created; const months = Math.max(1, Math.round(n(reservation.months, 1))); const end = String(reservation.endMonth || '').trim() || monthFromParts(reservation.month2, reservation.year2) || addMonths(start, months - 1); return { start, end }; };
const periodOf = (contract: Contract) => { const original = originalPeriodOf(contract); const reservation = reservationOf(contract); const plan = planOf(contract); const end = String(plan.currentEndMonth || reservation.currentEndMonth || '').trim() || original.end; return { start: original.start, end, originalEnd: original.end }; };
const fmtKg = (value: number) => Math.round(value).toLocaleString() + ' kg';
const fmtBags = (value: number) => Math.round(value).toLocaleString() + ' bags';
const distribute = (total: number, slots: number) => { const safeTotal = Math.max(0, Math.round(total)); if (slots <= 0) return []; const base = Math.floor(safeTotal / slots); const remainder = safeTotal % slots; return Array.from({ length: slots }, (_, index) => base + (index === slots - 1 ? remainder : 0)); };
type ContractTotals = { totalBags: number; totalKg: number; remainingBags: number; remainingKg: number };
const totalsOf = (contract: Contract): ContractTotals => selectionsOf(contract).reduce<ContractTotals>((acc, selection) => { const bags = roundBags(selection.bags); const bagKg = bagKgOf(selection); const kg = n(selection.lineKg, bags * bagKg); const remainingBags = roundBags(selection.remainingBags ?? bags); const remainingKg = n(selection.remainingKg, remainingBags * bagKg); return { totalBags: acc.totalBags + bags, totalKg: acc.totalKg + kg, remainingBags: acc.remainingBags + remainingBags, remainingKg: acc.remainingKg + remainingKg }; }, { totalBags: 0, totalKg: 0, remainingBags: 0, remainingKg: 0 });
const targetsForSelection = (selection: Selection, selectionIndex: number, monthKeys: string[], plan: Plan, actualByMonth?: Map<string, Actual>): Target[] => {
  const totalBags = roundBags(selection.bags);
  const bagKg = bagKgOf(selection);
  const targets = distribute(totalBags, monthKeys.length);
  const overrides = plan.expectedOverrides || {};
  const fixed = monthKeys.map((key, index) => {
    const actual = actualByMonth?.get(key);
    const orderedBags = roundBags((actual?.fulfilledBags || 0) + (actual?.openBags || 0));
    if (orderedBags > 0) return { key, index, value: orderedBags };
    const overrideValue = overrides[key]?.[String(selectionIndex)];
    return typeof overrideValue === 'number' ? { key, index, value: overrideValue } : null;
  }).filter((item): item is { key: string; index: number; value: number } => Boolean(item)).sort((a, b) => a.index - b.index);

  fixed.forEach((item) => {
    targets[item.index] = roundBags(item.value);
    const fixedThroughCurrent = targets.slice(0, item.index + 1).reduce((sum, value) => sum + value, 0);
    const futureFixed = new Set(fixed.filter((future) => future.index > item.index).map((future) => future.index));
    const futureFixedTotal = Array.from(futureFixed).reduce((sum, index) => sum + roundBags(fixed.find((item) => item.index === index)?.value), 0);
    const flexibleIndexes = monthKeys.map((_, index) => index).filter((index) => index > item.index && !futureFixed.has(index));
    const remaining = Math.max(0, totalBags - fixedThroughCurrent - futureFixedTotal);
    const futureTargets = distribute(remaining, flexibleIndexes.length);
    flexibleIndexes.forEach((targetIndex, position) => { targets[targetIndex] = futureTargets[position] || 0; });
  });

  return targets.map((bags) => ({ expectedBags: bags, expectedKg: bags * bagKg }));
};

const emptyActual = (): Actual => ({ fulfilledBags: 0, fulfilledKg: 0, openBags: 0, openKg: 0 });
const fulfilledStatus = (status: string) => ['handoff', 'completed'].includes(status.toLowerCase().trim());
const openStatus = (status: string) => ['pending', 'processing'].includes(status.toLowerCase().trim());
const itemKg = (item: OrderItem) => n(item.lineKg, n(item.bags) * n(item.bagKg, 24));

const actualsBySelection = (contract: Contract, orders: Order[]) => {
  const actuals = new Map<number, Map<string, Actual>>();
  const ensure = (selectionIndex: number, key: string) => { if (!actuals.has(selectionIndex)) actuals.set(selectionIndex, new Map()); const byMonth = actuals.get(selectionIndex)!; if (!byMonth.has(key)) byMonth.set(key, emptyActual()); return byMonth.get(key)!; };
  const selectionIndexByName = new Map<string, number>();
  selectionsOf(contract).forEach((selection, index) => { selectionIndexByName.set(labelNorm(selectionName(selection, index)), index); });
  const history = Array.isArray(contract.dispatchHistory) ? contract.dispatchHistory : Array.isArray(contract.details?.dispatchHistory) ? contract.details.dispatchHistory : [];
  history.forEach((entry: any) => {
    const key = monthKey(toDate(entry.createdAt));
    if (!key) return;
    (entry.lines || []).forEach((line: any) => {
      const directIndex = typeof line.selectionIndex === 'number' ? line.selectionIndex : undefined;
      const namedIndex = selectionIndexByName.get(labelNorm(line.variety));
      const selectionIndex = typeof directIndex === 'number' ? directIndex : namedIndex;
      if (typeof selectionIndex !== 'number') return;
      const actual = ensure(selectionIndex, key);
      actual.fulfilledBags += n(line.bags);
      actual.fulfilledKg += n(line.kg);
    });
  });
  orders.forEach((order) => {
    const key = monthKey(order.preferredDeliveryDate || order.createdAt);
    if (!key) return;
    order.items.forEach((item) => {
      if (item.sourceType !== 'contract_reserved' || item.contractId !== contract.id) return;
      const selectionIndex = Number(item.contractSelectionIndex);
      if (!Number.isInteger(selectionIndex)) return;
      const actual = ensure(selectionIndex, key);
      const bags = n(item.bags);
      const kg = itemKg(item);
      if (fulfilledStatus(order.status)) { actual.fulfilledBags += bags; actual.fulfilledKg += kg; }
      else if (openStatus(order.status)) { actual.openBags += bags; actual.openKg += kg; }
    });
  });
  return actuals;
};

const cellState = (key: string, expectedBags: number, actualBags: number, openBags: number): State => {
  const today = currentMonthKey();
  if (key > today) return 'planned';
  if (actualBags > expectedBags) return 'ahead';
  if (expectedBags > 0 && actualBags === expectedBags) return 'ok';
  if (actualBags > 0) return 'partial';
  if (openBags > 0) return 'open';
  if (key === today) return 'due';
  return 'missed';
};

const latestActualMonth = (actuals: Map<number, Map<string, Actual>>) => {
  let latest = '';
  actuals.forEach((byMonth) => {
    byMonth.forEach((actual, key) => {
      if (actual.fulfilledBags + actual.openBags > 0) latest = latest ? maxMonth(latest, key) : key;
    });
  });
  return latest;
};

const buildRow = (contract: Contract, orders: Order[]): ControlRow | null => {
  const basePeriod = periodOf(contract);
  if (!/^\d{4}-\d{2}$/.test(basePeriod.start) || !/^\d{4}-\d{2}$/.test(basePeriod.end)) return null;
  const actuals = actualsBySelection(contract, orders);
  const activityEnd = latestActualMonth(actuals);
  const period = { ...basePeriod, end: activityEnd ? maxMonth(basePeriod.end, activityEnd) : basePeriod.end };
  const monthKeys = monthsBetween(period.start, period.end);
  if (!monthKeys.length) return null;
  const totals = totalsOf(contract);
  if (totals.totalKg <= 0) return null;
  const plan = planOf(contract);
  const varieties: VarietyRow[] = selectionsOf(contract).map((selection, selectionIndex) => {
    const totalBags = roundBags(selection.bags);
    const bagKg = bagKgOf(selection);
    const totalKg = n(selection.lineKg, totalBags * bagKg);
    const remainingBags = roundBags(selection.remainingBags ?? totalBags);
    const remainingKg = n(selection.remainingKg, remainingBags * bagKg);
    const fulfilledBags = Math.max(0, totalBags - remainingBags);
    const fulfilledKg = Math.max(0, totalKg - remainingKg);
    const byMonth = actuals.get(selectionIndex) || new Map<string, Actual>();
    const targets = targetsForSelection(selection, selectionIndex, monthKeys, plan, byMonth);
    const cells = monthKeys.map((key, index) => { const actual = byMonth.get(key) || emptyActual(); const target = targets[index] || { expectedBags: 0, expectedKg: 0 }; return { key, label: monthLabel(key), expectedBags: target.expectedBags, expectedKg: target.expectedKg, actualBags: actual.fulfilledBags, actualKg: actual.fulfilledKg, openBags: actual.openBags, openKg: actual.openKg, state: cellState(key, target.expectedBags, actual.fulfilledBags, actual.openBags) }; });
    return { selectionIndex, variety: selectionName(selection, selectionIndex), totalBags, totalKg, remainingBags, remainingKg, fulfilledBags, fulfilledKg, bagKg, cells };
  });
  const today = currentMonthKey();
  const monthsLeft = today > period.end ? 0 : Math.max(1, monthDiffInclusive(today < period.start ? period.start : today, period.end));
  const fulfilledKg = Math.max(0, totals.totalKg - totals.remainingKg);
  const fulfilledBags = Math.max(0, totals.totalBags - totals.remainingBags);
  const plannedToDateKg = varieties.reduce((sum, variety) => sum + variety.cells.filter((cell) => cell.key <= today).reduce((subtotal, cell) => subtotal + cell.expectedKg, 0), 0);
  const balanceKg = fulfilledKg - plannedToDateKg;
  const openKg = varieties.reduce((sum, variety) => sum + variety.cells.reduce((subtotal, cell) => subtotal + cell.openKg, 0), 0);
  const baseBags = varieties.reduce((sum, variety) => sum + (variety.cells[0]?.expectedBags || 0), 0);
  const baseKg = varieties.reduce((sum, variety) => sum + (variety.cells[0]?.expectedKg || 0), 0);
  const avgRemainingKg = totals.remainingBags > 0 ? totals.remainingKg / totals.remainingBags : 0;
  const currentBags = monthsLeft > 0 ? Math.ceil(totals.remainingBags / monthsLeft) : 0;
  const currentKg = currentBags * avgRemainingKg;
  let status: RowStatus = 'on_track';
  if (totals.remainingKg > 0 && today > period.end) status = 'needs_extension';
  else if (balanceKg < -Math.max(1, baseKg * 0.2)) status = 'behind';
  else if (balanceKg > Math.max(1, baseKg * 0.2)) status = 'ahead';
  else if (today >= period.start && today <= period.end) status = 'due';
  return { contract, contractNo: contract.contractNo || contract.id, customer: contract.name || contract.details?.customer?.fullName || contract.email || 'Unknown customer', startMonth: period.start, endMonth: period.end, originalEndMonth: period.originalEnd, periodLabel: monthLabel(period.start) + ' - ' + monthLabel(period.end), status, totalBags: totals.totalBags, totalKg: totals.totalKg, remainingBags: totals.remainingBags, remainingKg: totals.remainingKg, fulfilledBags, fulfilledKg, completionPct: totals.totalKg > 0 ? Math.round((fulfilledKg / totals.totalKg) * 100) : 0, monthsLeft, baseBags, baseKg, currentBags, currentKg, nextBags: totals.remainingBags > 0 ? Math.max(1, currentBags) : 0, plannedToDateKg, balanceKg, openKg, varieties };
};
const statusMeta: Record<RowStatus, { label: string; className: string }> = {
  on_track: { label: 'On track', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  due: { label: 'Due now', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ahead: { label: 'Ahead', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  behind: { label: 'Behind', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  needs_extension: { label: 'Needs extension', className: 'bg-red-50 text-red-700 border-red-200' },
};
const cellClass = (state: State) => { if (state === 'ahead') return 'bg-[#0b5a43] text-white border-[#0b5a43]'; if (state === 'ok') return 'bg-emerald-100 text-emerald-800 border-emerald-200'; if (state === 'partial') return 'bg-amber-50 text-amber-800 border-amber-200'; if (state === 'open') return 'bg-yellow-50 text-yellow-800 border-yellow-200'; if (state === 'due') return 'bg-blue-50 text-blue-800 border-blue-200'; if (state === 'missed') return 'bg-red-50 text-red-700 border-red-200'; return 'bg-gray-50 text-gray-400 border-gray-200'; };
const cellLabel = (state: State) => { if (state === 'planned') return 'Planned'; if (state === 'ahead') return 'Ahead'; if (state === 'ok') return 'OK'; if (state === 'partial') return 'Partial'; if (state === 'open') return 'Open'; if (state === 'due') return 'Due'; return 'Missed'; };
const withPlan = (contract: Contract, plan: Plan): Contract => ({ ...contract, details: { ...(contract.details || {}), reservation: { ...reservationOf(contract), controlPlan: plan } } });
const planWithOverride = (plan: Plan, month: string, selectionIndex: number, bags: number): Plan => { const expectedOverrides = { ...(plan.expectedOverrides || {}) }; expectedOverrides[month] = { ...(expectedOverrides[month] || {}), [String(selectionIndex)]: bags }; return { ...plan, expectedOverrides, updatedAt: new Date().toISOString() }; };
const rebalancedPlan = (row: ControlRow, targetEnd: string): Plan => {
  const targetMonths = monthsBetween(row.startMonth, targetEnd);
  const today = currentMonthKey();
  const expectedOverrides: Record<string, Record<string, number>> = {};
  row.varieties.forEach((variety) => {
    const oldExpected = new Map(variety.cells.map((cell) => [cell.key, cell.expectedBags]));
    const orderedByMonth = new Map(variety.cells.map((cell) => [cell.key, cell.actualBags + cell.openBags]));
    const fixedMonths = targetMonths.filter((key) => {
      const ordered = orderedByMonth.get(key) || 0;
      const originalPast = key < today && key <= row.originalEndMonth;
      return ordered > 0 || originalPast;
    });
    const fixedTotal = fixedMonths.reduce((sum, key) => {
      const ordered = orderedByMonth.get(key) || 0;
      return sum + (ordered > 0 ? ordered : oldExpected.get(key) || 0);
    }, 0);
    const flexibleMonths = targetMonths.filter((key) => !fixedMonths.includes(key));
    const flexiblePlan = distribute(Math.max(0, variety.totalBags - fixedTotal), flexibleMonths.length);
    targetMonths.forEach((key) => {
      if (!expectedOverrides[key]) expectedOverrides[key] = {};
      const ordered = orderedByMonth.get(key) || 0;
      if (ordered > 0) expectedOverrides[key][String(variety.selectionIndex)] = ordered;
      else if (fixedMonths.includes(key)) expectedOverrides[key][String(variety.selectionIndex)] = oldExpected.get(key) || 0;
      else expectedOverrides[key][String(variety.selectionIndex)] = flexiblePlan[flexibleMonths.indexOf(key)] || 0;
    });
  });
  return { ...planOf(row.contract), currentEndMonth: targetEnd, expectedOverrides, updatedAt: new Date().toISOString() };
};
const extendedPlan = (row: ControlRow): Plan => rebalancedPlan(row, addMonths(row.endMonth, 1));
const reducedPlan = (row: ControlRow): Plan => rebalancedPlan(row, addMonths(row.endMonth, -1));
const hasActivityInMonth = (row: ControlRow, month: string) => row.varieties.some((variety) => variety.cells.some((cell) => cell.key === month && (cell.actualBags > 0 || cell.openBags > 0)));
const canRemoveAddedMonth = (row: ControlRow) => row.endMonth > row.originalEndMonth && !hasActivityInMonth(row, row.endMonth);

const ContractControlV2: React.FC = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RowStatus>('all');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editBags, setEditBags] = useState('0');
  const [saving, setSaving] = useState(false);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'cards'>('chart');

  const updateLocal = (contractId: string, plan: Plan) => setContracts((prev) => prev.map((contract) => contract.id === contractId ? withPlan(contract, plan) : contract));
  const savePlan = async (contract: Contract, plan: Plan) => { const db = getFirestore(); await updateDoc(doc(db, 'contracts', contract.id), { 'details.reservation.controlPlan': plan, updatedAt: serverTimestamp() }); updateLocal(contract.id, plan); };
  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const token = await currentUser?.getIdToken();
      const response = await fetch(String(import.meta.env.VITE_FULL_ENDPOINT) + '/api/getContracts', { headers: token ? { Authorization: 'Bearer ' + token } : undefined });
      if (!response.ok) throw new Error('Failed to load contracts');
      const contractData = await response.json();
      setContracts(Array.isArray(contractData) ? contractData : []);
      const db = getFirestore();
      const snapshot = await getDocs(collection(db, 'orders'));
      const loaded: Order[] = [];
      snapshot.forEach((docSnap) => { const data = docSnap.data() as any; loaded.push({ id: docSnap.id, status: data.status || 'pending', createdAt: toDate(data.createdAt), preferredDeliveryDate: toDate(data.preferredDeliveryDate), items: Array.isArray(data.items) ? data.items : [] }); });
      setOrders(loaded);
    } catch (err) { console.error('Contract control load error:', err); setError(err instanceof Error ? err.message : 'Failed to load contract control.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (currentUser) loadData(); }, [currentUser]);

  const rows = useMemo(() => contracts.filter((contract) => String(contract.status || '').toLowerCase() === 'active').map((contract) => buildRow(contract, orders)).filter((row): row is ControlRow => Boolean(row)).sort((a, b) => { const priority: Record<RowStatus, number> = { needs_extension: 0, behind: 1, due: 2, ahead: 3, on_track: 4 }; return priority[a.status] - priority[b.status] || b.remainingKg - a.remainingKg; }), [contracts, orders]);
  const filteredRows = useMemo(() => { const term = search.trim().toLowerCase(); return rows.filter((row) => { if (statusFilter !== 'all' && row.status !== statusFilter) return false; if (!term) return true; return [row.customer, row.contractNo, row.contract.email].some((value) => String(value || '').toLowerCase().includes(term)); }); }, [rows, search, statusFilter]);
  const summary = useMemo(() => rows.reduce((acc, row) => ({ total: acc.total + 1, attention: acc.attention + (row.status === 'behind' || row.status === 'needs_extension' ? 1 : 0), remainingKg: acc.remainingKg + row.remainingKg, openKg: acc.openKg + row.openKg }), { total: 0, attention: 0, remainingKg: 0, openKg: 0 }), [rows]);
  const openEdit = (row: ControlRow, variety: VarietyRow, cell: Cell) => { setEditTarget({ contractId: row.contract.id, contractNo: row.contractNo, monthKey: cell.key, monthLabel: cell.label, selectionIndex: variety.selectionIndex, variety: variety.variety, currentBags: cell.expectedBags }); setEditBags(String(cell.expectedBags)); };
  const saveExpected = async () => { if (!editTarget) return; const contract = contracts.find((item) => item.id === editTarget.contractId); if (!contract) return; try { setSaving(true); const next = planWithOverride(planOf(contract), editTarget.monthKey, editTarget.selectionIndex, roundBags(editBags)); await savePlan(contract, next); setEditTarget(null); } catch (err) { alert(err instanceof Error ? err.message : 'Could not save expected bags.'); } finally { setSaving(false); } };
  const extend = async (row: ControlRow) => { try { setExtendingId(row.contract.id); await savePlan(row.contract, extendedPlan(row)); } catch (err) { alert(err instanceof Error ? err.message : 'Could not extend contract.'); } finally { setExtendingId(null); } };
  const removeLastMonth = async (row: ControlRow) => {
    if (!canRemoveAddedMonth(row)) return;
    try { setRemovingId(row.contract.id); await savePlan(row.contract, reducedPlan(row)); }
    catch (err) { alert(err instanceof Error ? err.message : 'Could not remove added month.'); }
    finally { setRemovingId(null); }
  };
  if (loading) return <div className='rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500'>Loading contract control...</div>;
  if (error) return <div className='rounded-lg border border-red-200 bg-red-50 p-5 text-red-700'>{error}</div>;

  return (
    <div className='min-w-0 max-w-full space-y-4 overflow-x-hidden'>
      <div className='min-w-0 overflow-hidden rounded-lg border border-[#dbe7df] bg-[#f7fbf8] p-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-[#5f8375]'>Contract control</p>
            <h3 className='mt-1 text-2xl font-bold text-[#073f2f]'>Monthly plan by coffee</h3>
            <p className='mt-1 max-w-2xl text-sm text-gray-600'>Review expected bags per variety, compare them with fulfilled orders, and adjust future months when the plan changes.</p>
          </div>
          <button type='button' onClick={loadData} className='h-10 rounded-md border border-[#174B3D] bg-white px-3 text-sm font-semibold text-[#174B3D] hover:bg-[#edf5f1]'>
            <FontAwesomeIcon icon={faRotateRight} className='mr-2' />Refresh
          </button>
        </div>
        <div className='mt-4 grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
          <div className='rounded-lg border border-white bg-white p-3 shadow-sm'><p className='text-xs uppercase tracking-[0.18em] text-gray-500'>Active</p><p className='mt-1 text-2xl font-bold text-gray-950'>{summary.total}</p></div>
          <div className='rounded-lg border border-white bg-white p-3 shadow-sm'><p className='text-xs uppercase tracking-[0.18em] text-gray-500'>Need attention</p><p className='mt-1 text-2xl font-bold text-[#d24d2f]'>{summary.attention}</p></div>
          <div className='rounded-lg border border-white bg-white p-3 shadow-sm'><p className='text-xs uppercase tracking-[0.18em] text-gray-500'>Still reserved</p><p className='mt-1 text-2xl font-bold text-gray-950'>{fmtKg(summary.remainingKg)}</p></div>
          <div className='rounded-lg border border-white bg-white p-3 shadow-sm'><p className='text-xs uppercase tracking-[0.18em] text-gray-500'>Orders in progress</p><p className='mt-1 text-2xl font-bold text-gray-950'>{fmtKg(summary.openKg)}</p></div>
        </div>
      </div>

      <div className='flex min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 xl:flex-row xl:items-center xl:justify-between'>
        <label className='relative min-w-0 flex-1'>
          <FontAwesomeIcon icon={faMagnifyingGlass} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search by customer, email or contract...' className='h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#174B3D] focus:ring-2 focus:ring-[#174B3D]/10' />
        </label>
        <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center'>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | RowStatus)} className='h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#174B3D] focus:ring-2 focus:ring-[#174B3D]/10'>
            <option value='all'>All statuses</option>
            <option value='needs_extension'>Needs extension</option>
            <option value='behind'>Behind</option>
            <option value='due'>Due now</option>
            <option value='ahead'>Ahead</option>
            <option value='on_track'>On track</option>
          </select>
          <div className='grid h-10 grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-1 text-sm font-semibold'>
            <button type='button' onClick={() => setViewMode('chart')} className={['inline-flex items-center justify-center gap-2 rounded px-3 transition', viewMode === 'chart' ? 'bg-[#174B3D] text-white shadow-sm' : 'text-gray-500 hover:text-[#174B3D]'].join(' ')}>
              <FontAwesomeIcon icon={faChartColumn} />Graph
            </button>
            <button type='button' onClick={() => setViewMode('cards')} className={['inline-flex items-center justify-center gap-2 rounded px-3 transition', viewMode === 'cards' ? 'bg-[#174B3D] text-white shadow-sm' : 'text-gray-500 hover:text-[#174B3D]'].join(' ')}>
              <FontAwesomeIcon icon={faTableCellsLarge} />Cards
            </button>
          </div>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className='rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500'>No active contracts match this view.</div>
      ) : (
        <div className='space-y-3'>
          {filteredRows.map((row) => {
            const meta = statusMeta[row.status];
            return (
              <article key={row.contract.id} className='min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'>
                <div className='grid min-w-0 gap-4 border-b border-gray-100 p-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.55fr)_minmax(150px,0.65fr)] 2xl:items-center'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h4 className='truncate text-lg font-bold text-gray-950'>{row.contractNo}</h4>
                      <span className={['rounded-full border px-2 py-0.5 text-xs font-semibold', meta.className].join(' ')}>{meta.label}</span>
                    </div>
                    <p className='mt-1 truncate text-sm font-medium text-gray-700'>{row.customer}</p>
                    <p className='text-xs text-gray-500'>{row.periodLabel}</p>
                  </div>
                  <div className='grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4'>
                    <div className='rounded-md bg-gray-50 p-2'><p className='text-[10px] uppercase tracking-wide text-gray-500'>Still reserved</p><p className='font-bold text-[#d24d2f]'>{fmtKg(row.remainingKg)}</p><p className='text-xs text-gray-500'>{fmtBags(row.remainingBags)}</p></div>
                    <div className='rounded-md bg-gray-50 p-2'><p className='text-[10px] uppercase tracking-wide text-gray-500'>Base plan</p><p className='font-bold text-gray-950'>{fmtBags(row.baseBags)}</p><p className='text-xs text-gray-500'>{fmtKg(row.baseKg)} / mo</p></div>
                    <div className='rounded-md bg-gray-50 p-2'><p className='text-[10px] uppercase tracking-wide text-gray-500'>Needed now</p><p className='font-bold text-gray-950'>{row.monthsLeft ? fmtBags(row.currentBags) : 'Extend'}</p><p className='text-xs text-gray-500'>{row.monthsLeft ? fmtKg(row.currentKg) + ' / mo' : 'No months left'}</p></div>
                    <div className='rounded-md bg-gray-50 p-2'><p className='text-[10px] uppercase tracking-wide text-gray-500'>Suggested next</p><p className='font-bold text-gray-950'>{row.nextBags ? row.nextBags + ' bags' : 'Done'}</p><p className='text-xs text-gray-500'>{row.monthsLeft} mo left</p></div>
                  </div>
                  <div className='min-w-0 2xl:min-w-[150px]'>
                    <div className='flex items-center justify-between text-xs text-gray-500'><span>{row.completionPct}% fulfilled</span><span>{fmtKg(row.fulfilledKg)}</span></div>
                    <div className='mt-2 h-2 rounded-full bg-gray-100'><div className='h-2 rounded-full bg-[#174B3D]' style={{ width: Math.max(4, Math.min(100, row.completionPct)) + '%' }} /></div>
                    <p className='mt-2 text-xs text-gray-500'>{row.balanceKg < -1 ? fmtKg(Math.abs(row.balanceKg)) + ' behind the plan' : row.balanceKg > 1 ? fmtKg(row.balanceKg) + ' ahead of the plan' : 'Aligned with the plan'}</p>
                  </div>
                </div>
                <div className='min-w-0 space-y-4 p-4'>
                  {row.varieties.map((variety) => (
                    <div key={variety.selectionIndex} className='min-w-0'>
                      <div className='mb-2 flex flex-col gap-1 md:flex-row md:items-end md:justify-between'>
                        <div>
                          <p className='text-sm font-bold text-gray-950'>{variety.variety}</p>
                          <p className='text-xs text-gray-500'>{fmtBags(variety.totalBags)} contracted - {fmtBags(variety.remainingBags)} still reserved</p>
                        </div>
                        <p className='text-xs text-gray-500'>{fmtKg(variety.fulfilledKg)} fulfilled</p>
                      </div>
                      {viewMode === 'chart' ? (() => {
                        const maxBags = Math.max(1, ...variety.cells.map((cell) => Math.max(cell.expectedBags, cell.actualBags + cell.openBags)));
                        return (
                          <div className='max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-[#fbfdfb] p-3'>
                            <div className='mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500'>
                              <div className='flex flex-wrap items-center gap-3'>
                                <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-sm bg-[#174B3D]' />Expected</span>
                                <span className='inline-flex items-center gap-1.5'><span className='h-2.5 w-2.5 rounded-sm bg-[#d75a3a]' />Ordered</span>
                                <span className='text-gray-400'>Bars are measured in bags.</span>
                              </div>
                              <span className='font-medium text-gray-600'>Scale max: {fmtBags(maxBags)}</span>
                            </div>
                            <div className='flex min-w-max items-end gap-3 pb-1'>
                              {variety.cells.map((cell) => {
                                const orderedBags = cell.actualBags + cell.openBags;
                                const expectedPct = Math.max(5, Math.round((cell.expectedBags / maxBags) * 100));
                                const orderedPct = orderedBags > 0 ? Math.max(5, Math.round((orderedBags / maxBags) * 100)) : 3;
                                return (
                                  <div key={cell.key} className={['w-32 shrink-0 rounded-md border bg-white p-2', cellClass(cell.state)].join(' ')}>
                                    <div className='mb-2 flex items-center justify-between gap-2'>
                                      <p className='text-[11px] font-semibold'>{cell.label}</p>
                                      <span className='text-[10px] font-bold uppercase opacity-80'>{cellLabel(cell.state)}</span>
                                    </div>
                                    <div className='flex h-28 items-end justify-center gap-3 rounded bg-white/70 px-2 py-2'>
                                      <div className='flex h-full w-7 flex-col justify-end gap-1 text-center'>
                                        <div title={'Expected ' + fmtBags(cell.expectedBags)} className='mx-auto w-5 rounded-t bg-[#174B3D] shadow-sm' style={{ height: expectedPct + '%' }} />
                                        <span className='text-[10px] font-semibold text-[#174B3D]'>{cell.expectedBags}</span>
                                      </div>
                                      <div className='flex h-full w-7 flex-col justify-end gap-1 text-center'>
                                        <div title={'Ordered ' + fmtBags(orderedBags)} className='mx-auto w-5 rounded-t bg-[#d75a3a] shadow-sm' style={{ height: orderedPct + '%' }} />
                                        <span className='text-[10px] font-semibold text-[#d75a3a]'>{orderedBags}</span>
                                      </div>
                                    </div>
                                    <div className='mt-2 flex items-center justify-between gap-2'>
                                      <p className='text-[11px] text-gray-600'>{cell.actualBags > 0 ? 'Fulfilled ' + fmtBags(cell.actualBags) : cell.openBags > 0 ? 'Open ' + fmtBags(cell.openBags) : 'No order yet'}</p>
                                      {cell.key >= currentMonthKey() ? (
                                        <button type='button' title='Edit expected bags' onClick={() => openEdit(row, variety, cell)} className='rounded border border-gray-200 bg-white px-1.5 py-1 text-[10px] text-gray-500 hover:border-[#174B3D] hover:text-[#174B3D]'>
                                          <FontAwesomeIcon icon={faPen} />
                                        </button>
                                      ) : (
                                        <span title='Past months are locked' className='rounded border border-gray-200 bg-white px-1.5 py-1 text-[10px] text-gray-400'>Locked</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              <button type='button' onClick={() => extend(row)} disabled={extendingId === row.contract.id} title='Add one month and rebalance future expected bags' className='flex h-[180px] w-32 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-gray-500 hover:border-[#174B3D] hover:text-[#174B3D] disabled:opacity-60'>
                                <FontAwesomeIcon icon={faPlus} className='mb-2' />
                                <span className='text-xs font-semibold'>Add month</span>
                                <span className='text-[11px]'>Rebalance</span>
                              </button>
                              {row.endMonth > row.originalEndMonth && (
                                <button type='button' onClick={() => removeLastMonth(row)} disabled={!canRemoveAddedMonth(row) || removingId === row.contract.id} title={hasActivityInMonth(row, row.endMonth) ? 'This month has orders or dispatches and cannot be removed' : 'Remove the last added month'} className='flex h-[180px] w-32 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-red-200 bg-red-50 p-3 text-center text-red-500 hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50'>
                                  <FontAwesomeIcon icon={faXmark} className='mb-2' />
                                  <span className='text-xs font-semibold'>Remove</span>
                                  <span className='text-[11px]'>{hasActivityInMonth(row, row.endMonth) ? 'Has activity' : monthLabel(row.endMonth)}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className='max-w-full overflow-x-auto pb-1'><div className='flex min-w-max gap-2'>
                          {variety.cells.map((cell) => (
                            <div key={cell.key} className={['w-36 rounded-md border p-2 text-left', cellClass(cell.state)].join(' ')}>
                              <div className='flex items-center justify-between gap-2'>
                                <p className='text-[11px] font-semibold'>{cell.label}</p>
                                <span className='text-[10px] font-bold uppercase opacity-80'>{cellLabel(cell.state)}</span>
                              </div>
                              <div className='mt-2 flex items-start justify-between gap-2'>
                                <div>
                                  <p className='text-[10px] uppercase opacity-70'>Expected</p>
                                  <p className='text-sm font-bold'>{fmtBags(cell.expectedBags)}</p>
                                  <p className='text-[11px] opacity-80'>{fmtKg(cell.expectedKg)}</p>
                                </div>
                                {cell.key >= currentMonthKey() ? (
                                  <button type='button' title='Edit expected bags' onClick={() => openEdit(row, variety, cell)} className='rounded border border-current/20 px-1.5 py-1 text-[10px] opacity-80 hover:opacity-100'>
                                    <FontAwesomeIcon icon={faPen} />
                                  </button>
                                ) : (
                                  <span title='Past months are locked' className='rounded border border-current/10 px-1.5 py-1 text-[10px] opacity-50'>Locked</span>
                                )}
                              </div>
                              <p className='mt-1 text-[11px] opacity-80'>{cell.actualBags > 0 ? 'Fulfilled ' + fmtBags(cell.actualBags) : cell.openBags > 0 ? 'Open ' + fmtBags(cell.openBags) : 'No order yet'}</p>
                            </div>
                          ))}
                          <button type='button' onClick={() => extend(row)} disabled={extendingId === row.contract.id} title='Add one month and rebalance future expected bags' className='flex w-36 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-gray-500 hover:border-[#174B3D] hover:text-[#174B3D] disabled:opacity-60'>
                            <FontAwesomeIcon icon={faPlus} className='mb-2' />
                            <span className='text-xs font-semibold'>Add month</span>
                            <span className='text-[11px]'>Rebalance future</span>
                          </button>
                          {row.endMonth > row.originalEndMonth && (
                            <button type='button' onClick={() => removeLastMonth(row)} disabled={!canRemoveAddedMonth(row) || removingId === row.contract.id} title={hasActivityInMonth(row, row.endMonth) ? 'This month has orders or dispatches and cannot be removed' : 'Remove the last added month'} className='flex w-36 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-red-200 bg-red-50 p-3 text-center text-red-500 hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50'>
                              <FontAwesomeIcon icon={faXmark} className='mb-2' />
                              <span className='text-xs font-semibold'>Remove month</span>
                              <span className='text-[11px]'>{hasActivityInMonth(row, row.endMonth) ? 'Has activity' : monthLabel(row.endMonth)}</span>
                            </button>
                          )}
                        </div></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className='grid gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600 md:grid-cols-3'>
                  <p><FontAwesomeIcon icon={faCalendarDays} className='mr-2 text-[#174B3D]' />Plan up to today: <b>{fmtKg(row.plannedToDateKg)}</b></p>
                  <p><FontAwesomeIcon icon={faCheck} className='mr-2 text-[#174B3D]' />Fulfilled so far: <b>{fmtKg(row.fulfilledKg)}</b></p>
                  <p><FontAwesomeIcon icon={faArrowTrendUp} className='mr-2 text-[#174B3D]' />Orders in progress: <b>{fmtKg(row.openKg)}</b></p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-md rounded-lg bg-white shadow-xl'>
            <div className='flex items-center justify-between border-b border-gray-100 p-4'>
              <div>
                <h3 className='text-lg font-bold text-gray-950'>Edit expected bags</h3>
                <p className='text-sm text-gray-500'>{editTarget.contractNo} - {editTarget.monthLabel}</p>
              </div>
              <button type='button' onClick={() => setEditTarget(null)} className='rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700'><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className='p-4'>
              <p className='mb-3 text-sm font-medium text-gray-700'>{editTarget.variety}</p>
              <label className='text-xs font-semibold uppercase tracking-wide text-gray-500'>Expected bags</label>
              <input type='number' min='0' step='1' value={editBags} onChange={(event) => setEditBags(event.target.value)} className='mt-1 h-11 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-[#174B3D] focus:ring-2 focus:ring-[#174B3D]/10' />
              <p className='mt-2 text-xs text-gray-500'>Future months for this coffee rebalance automatically so the contracted total stays controlled.</p>
            </div>
            <div className='flex justify-end gap-2 border-t border-gray-100 p-4'>
              <button type='button' onClick={() => setEditTarget(null)} className='h-9 rounded-md border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50'>Cancel</button>
              <button type='button' onClick={saveExpected} disabled={saving} className='h-9 rounded-md bg-[#174B3D] px-3 text-sm font-semibold text-white hover:bg-[#0f3a2d] disabled:opacity-60'>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractControlV2;











