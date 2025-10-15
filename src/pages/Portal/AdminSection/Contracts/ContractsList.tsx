import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch, faTrash, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Contract {
  id: string;
  name: string;
  email: string;
  s3Url: string;
  fileKey: string;
  status: string;
  createdAt:
    | { seconds: number; nanoseconds: number }
    | { _seconds: number; _nanoseconds: number }
    | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 border-orange-300',
  processing: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const ContractsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Controles de lista
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    '' | 'pending' | 'processing' | 'completed' | 'cancelled'
  >('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc'>('date_desc');

  // Selección / detalle
  const [selected, setSelected] = useState<Contract | null>(null);
  const [updating, setUpdating] = useState(false);

  // Eliminar
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Modal de cambio de status
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusToApply, setStatusToApply] = useState<'' | 'pending' | 'processing' | 'completed' | 'cancelled'>('');
  const [statusTarget, setStatusTarget] = useState<Contract | null>(null);
  const [statusConfirmChecked, setStatusConfirmChecked] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = await currentUser?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/getContracts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch contracts');
        const data = await response.json();
        setContracts(data);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [currentUser]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    try {
      const seconds = timestamp.seconds ?? timestamp._seconds;
      if (!seconds) return '—';
      const date = new Date(seconds * 1000);
      return date.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = contracts;

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.fileKey.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }

    const byDate = (c: Contract) => {
      const s = (c.createdAt as any)?.seconds ?? (c.createdAt as any)?._seconds ?? 0;
      return s * 1000;
    };

    return [...list].sort((a, b) =>
      sortBy === 'date_asc' ? byDate(a) - byDate(b) : byDate(b) - byDate(a)
    );
  }, [contracts, search, statusFilter, sortBy]);

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    setDeleting(true);
    try {
      const token = await currentUser?.getIdToken();

      // 1) Eliminar de S3
      const s3Response = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/s3/deleteContractFile`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileKey: contractToDelete.fileKey }),
        }
      );
      if (!s3Response.ok) throw new Error('Failed to delete from S3');

      // 2) Eliminar de Firestore
      const firestoreResponse = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/api/contracts/${contractToDelete.id}/delete`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!firestoreResponse.ok) throw new Error('Failed to delete from Firestore');

      // 3) Actualizar estado local
      setContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
      if (selected?.id === contractToDelete.id) setSelected(null);

      // Reset UI
      setDeleteModalOpen(false);
      setConfirmText('');
      setContractToDelete(null);
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('An error occurred while deleting the contract.');
    } finally {
      setDeleting(false);
    }
  };

  // Construye el HTML del correo de cambio de estado
  const buildStatusEmailHTML = (name: string | null, contractId: string, newStatus: string) => `
  <html>
    <body style="margin:0;padding:0;background:#f6f8fa;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fa;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #eaecef;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111;">
              
              <tr>
                <td style="padding:20px 24px 12px;">
                  <h1 style="margin:0;font-size:18px;line-height:1.3;color:#111;">Your contract status has changed</h1>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">
                    Hello ${name || 'there'},
                  </p>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#444;">
                    We wanted to let you know that your contract <b>#${contractId}</b> has been updated.
                  </p>
                </td>
              </tr>
  
              <tr>
                <td style="padding:12px 24px;">
                  <div style="height:1px;background:#eaecef;"></div>
                </td>
              </tr>
  
              <tr>
                <td style="padding:0 24px 4px;">
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#444;">
                    <b>New status:</b>
                    <span style="
                      display:inline-block;
                      margin-left:6px;
                      padding:2px 8px;
                      font-size:12px;
                      line-height:1.6;
                      border:1px solid #dfe2e6;
                      border-radius:999px;
                      text-transform:capitalize;
                      background:#f3f4f6;
                      color:#111;
                    ">
                      ${newStatus}
                    </span>
                  </p>
                </td>
              </tr>
  
              <tr>
                <td style="padding:0 24px 16px;">
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#444;">
                    You can check your contract anytime in <b>My Contracts</b>.
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
                    If you have any questions, simply reply to this email and our team will get back to you.
                  </p>
                </td>
              </tr>
  
              <tr>
                <td style="padding:16px 24px 20px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">
                    — The Caribbean Goods Team
                  </p>
                </td>
              </tr>
            </table>
  
            <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a8f98;font-family:Arial,Helvetica,sans-serif;">
              This message was sent regarding contract #${contractId}.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
  

  // Abre modal de confirmación de status
  const openStatusModal = (target: Contract, nextStatus: Contract['status']) => {
    setStatusTarget(target);
    setStatusToApply(nextStatus as any);
    setStatusConfirmChecked(false);
    setStatusModalOpen(true);
  };

  // Aplica el cambio, actualiza Firestore y manda el correo
  const confirmStatusChange = async () => {
    if (!statusTarget || !statusToApply) return;
    setStatusSubmitting(true);
    try {
      // 1) PATCH status
      await updateStatus(statusTarget.id, statusToApply);

      // 2) Email al dueño del contrato
      try {
        const token = await currentUser?.getIdToken();
        const subject = `Your contract #${statusTarget.id} status has changed`;
        const html = buildStatusEmailHTML(statusTarget.name, statusTarget.id, statusToApply);

        await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendCustomEmail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            recipientEmail: statusTarget.email,
            subject,
            html,
          }),
        });
      } catch (e) {
        console.error('Email send error:', e);
      }
    } finally {
      setStatusSubmitting(false);
      setStatusModalOpen(false);
      setStatusTarget(null);
      setStatusToApply('');
    }
  };

  // PATCH al backend (solo cambia estado local si el backend responde OK)
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdating(true);
      const token = await currentUser?.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/orders/contracts/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error('Failed to update contract status');
      const data = await res.json();

      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: data.newStatus ?? newStatus } : c))
      );
      if (selected?.id === id) {
        setSelected({ ...selected, status: data.newStatus ?? newStatus });
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Loading contracts...</p>;

  // ─────────────────────────────
  // VISTA DE DETALLE
  // ─────────────────────────────
  if (selected) {
    const c = selected;
    return (
      <div className="bg-white p-5 rounded-lg shadow text-[#111]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelected(null)}
            className="text-sm px-3 py-1 rounded border hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Back to contracts
          </button>

        <div className="flex items-center gap-3">
            <a
              href={c.s3Url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm inline-flex items-center gap-2"
              title="Download"
            >
              <FontAwesomeIcon icon={faDownload} />
              Download
            </a>
            <button
              onClick={() => {
                setContractToDelete(c);
                setDeleteModalOpen(true);
              }}
              className="px-3 py-1.5 rounded border text-red-700 bg-white hover:bg-red-50 text-sm inline-flex items-center gap-2"
              title="Delete Contract"
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete
            </button>
          </div>
        </div>

        {/* Title + Status */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Contract #{c.id}</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wide ${
              statusColors[c.status] || 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            {c.status}
          </span>
        </div>

        {/* Update status (abre modal) */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-wide text-gray-600 mr-2">
            Update status
          </label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={c.status}
            disabled={updating}
            onChange={(e) => openStatusModal(c, e.target.value as any)}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Meta */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Customer</p>
            <p className="text-base font-medium">{c.name || '(No name)'}</p>
            {c.email && (
              <a className="text-sm text-blue-600 underline" href={`mailto:${c.email}`}>
                {c.email}
              </a>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Meta</p>
            <p className="text-sm text-gray-700">Created: {formatDate(c.createdAt)}</p>
            <p className="text-sm text-gray-700 break-all">
              File key: <span className="font-mono">{c.fileKey}</span>
            </p>
          </div>
        </div>

        {/* (Se omite mostrar la URL del archivo explícitamente) */}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModalOpen && contractToDelete && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!deleting) {
                  setDeleteModalOpen(false);
                  setConfirmText('');
                }
              }}
            >
              <motion.div
                className="bg-white p-6 rounded shadow-lg w/full max-w-sm"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
                <p className="text-sm mb-2">
                  Type <strong>delete permanently</strong> to confirm deletion of this contract.
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="border px-3 py-2 w-full rounded mb-4 text-sm"
                  disabled={deleting}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setConfirmText('');
                    }}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteContract}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
                    disabled={deleting || confirmText !== 'delete permanently'}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmación de Cambio de Status */}
        <AnimatePresence>
          {statusModalOpen && statusTarget && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!statusSubmitting) setStatusModalOpen(false);
              }}
            >
              <motion.div
                className="bg-white p-6 rounded shadow-lg w-full max-w-md"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-2">Confirm status change</h3>
                <p className="text-sm text-gray-700 mb-3">
                  You’re about to change the status of <b>Contract #{statusTarget.id}</b> from{' '}
                  <span className="capitalize">{statusTarget.status}</span> to{' '}
                  <span className="capitalize">{statusToApply}</span>.
                </p>
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                  A notification email will be sent to <b>{statusTarget.email}</b>.
                </p>

                <label className="flex items-center gap-2 text-sm mb-4">
                  <input
                    type="checkbox"
                    checked={statusConfirmChecked}
                    onChange={(e) => setStatusConfirmChecked(e.target.checked)}
                    className="h-4 w-4"
                  />
                  I understand and want to proceed.
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded border hover:bg-gray-50 text-sm"
                    disabled={statusSubmitting}
                    onClick={() => setStatusModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50"
                    disabled={!statusConfirmChecked || statusSubmitting}
                    onClick={confirmStatusChange}
                  >
                    {statusSubmitting ? 'Applying…' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────
  // LISTA
  // ─────────────────────────────
  return (
    <div className="bg-white p-4 rounded shadow">
      {/* Controles */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Contracts</h2>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative md:w-64">
            <input
              type="text"
              placeholder="Search name, email or key…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 pr-8 text-sm"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
          </select>

          {/* Reset */}
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setSortBy('date_desc');
            }}
            className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Listado */}
      {filteredAndSorted.length === 0 ? (
        <p className="text-gray-600">No contracts match your filters.</p>
      ) : (
        <ul className="space-y-3">
          {filteredAndSorted.map((c) => (
            <li
              key={c.id}
              className="border p-3 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelected(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? setSelected(c) : null)}
            >
              <p className="font-semibold mb-1">
                {c.name || '(No name)'} — {c.email || ''}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(c.createdAt)} • Status:{' '}
                <span
                  className={`px-2 py-0.5 rounded-full border ${
                    statusColors[c.status] || 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {c.status}
                </span>
              </p>
              {/* En la vista general NO mostramos Download / Delete */}
            </li>
          ))}
        </ul>
      )}

      {/* Modal eliminar (para cuando se dispare desde el detalle) */}
      <AnimatePresence>
        {deleteModalOpen && contractToDelete && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!deleting) {
                setDeleteModalOpen(false);
                setConfirmText('');
              }
            }}
          >
            <motion.div
              className="bg-white p-6 rounded shadow-lg w-full max-w-sm"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
              <p className="text-sm mb-2">
                Type <strong>delete permanently</strong> to confirm deletion of this contract.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="border px-3 py-2 w-full rounded mb-4 text-sm"
                disabled={deleting}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setConfirmText('');
                  }}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteContract}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
                  disabled={deleting || confirmText !== 'delete permanently'}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Cambio de Status */}
      <AnimatePresence>
        {statusModalOpen && statusTarget && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!statusSubmitting) setStatusModalOpen(false);
            }}
          >
            <motion.div
              className="bg-white p-6 rounded shadow-lg w-full max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Confirm status change</h3>

              <p className="text-sm text-gray-700 mb-2">
                You’re about to change the status of <b>Contract #{statusTarget.id}</b>.
              </p>

              {/* NUEVO: línea visual con status actual → nuevo */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-bold border capitalize ${
                    statusColors[statusTarget.status] || 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {statusTarget.status}
                </span>
                <span className="text-gray-400">→</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-bold border capitalize ${
                    statusColors[statusToApply] || 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {statusToApply || '—'}
                </span>
              </div>

              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                A notification email will be sent to <b>{statusTarget.email}</b>.
              </p>

              <label className="flex items-center gap-2 text-sm mb-4">
                <input
                  type="checkbox"
                  checked={statusConfirmChecked}
                  onChange={(e) => setStatusConfirmChecked(e.target.checked)}
                  className="h-4 w-4"
                />
                I understand and want to proceed.
              </label>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded border hover:bg-gray-50 text-sm"
                  disabled={statusSubmitting}
                  onClick={() => setStatusModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50"
                  disabled={!statusConfirmChecked || statusSubmitting}
                  onClick={confirmStatusChange}
                >
                  {statusSubmitting ? 'Applying…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ContractsList;
