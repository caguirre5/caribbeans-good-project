// ContractDetail.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faDownload, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 border-orange-300',
  active: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

export interface ContractDetailProps {
  contract: {
    id: string;
    contractNo?: string | null;
    name: string;
    email: string;
    s3Url: string;
    fileKey: string;
    status: string;
    createdAt:
      | { seconds: number; nanoseconds: number }
      | { _seconds: number; _nanoseconds: number }
      | null;
  };
  loading?: boolean;

  // callbacks que YA usabas en tu componente
  onBack: () => void;
  onUploadClick: () => void;
  onDeleteClick: () => void;

  // para mostrar el modal de delete
  deleteModalOpen: boolean;
  deleting: boolean;
  confirmText: string;
  onDeleteConfirmTextChange: (val: string) => void;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;

  // status
  onOpenStatusModal: (nextStatus: 'active' | 'completed' | 'cancelled') => void;

  // formato de fecha que ya tienes en el padre
  formatDate: (ts: any) => string;

  // status modal props
  statusModalOpen: boolean;
  statusTarget: {
    id: string;
    contractNo?: string | null;
    email: string;
    status: string;
  } | null;
  statusToApply: '' | 'active' | 'completed' | 'cancelled';
  statusConfirmChecked: boolean;
  onStatusCheckboxChange: (checked: boolean) => void;
  onStatusCancel: () => void;
  onStatusConfirm: () => void;
  statusSubmitting: boolean;
}

const ContractDetail: React.FC<ContractDetailProps> = ({
  contract: c,
  onBack,
  onUploadClick,
  onDeleteClick,
  deleteModalOpen,
  deleting,
  confirmText,
  onDeleteConfirmTextChange,
  onConfirmDelete,
  onCloseDeleteModal,
  onOpenStatusModal,
  formatDate,
  statusModalOpen,
  statusTarget,
  statusToApply,
  statusConfirmChecked,
  onStatusCheckboxChange,
  onStatusCancel,
  onStatusConfirm,
  statusSubmitting,
}) => {
  const label = c.contractNo || c.id;
  const isPending = c.status === 'pending';

  return (
    <div className="bg-white p-5 rounded-lg shadow text-[#111]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm px-3 py-1 rounded border hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
          Back to contracts
        </button>

        <div className="flex items-center gap-3">
          {/* Upload con activeView (sin modal) */}
          {isPending && (
            <button
              onClick={onUploadClick}
              className="px-3 py-1.5 rounded border bg-blue-600 hover:bg-blue-700 text-sm text-white inline-flex items-center gap-2"
              title="Upload Contract"
            >
              <FontAwesomeIcon icon={faUpload} />
              Upload
            </button>
          )}

          {c.s3Url ? (
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
          ) : null}
          <button
            onClick={onDeleteClick}
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
        <h2 className="text-xl font-semibold">Contract #{label}</h2>
        <span
          className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wide ${
            statusColors[c.status] || 'bg-gray-100 text-gray-700 border-gray-300'
          }`}
        >
          {c.status}
        </span>
      </div>

      {/* Update status: si es pending, SOLO aviso amarillo; si no, dropdown */}
      <div className="mb-5">
        {isPending ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 inline-block">
            Pending contracts cannot be edited until they are activated.
          </p>
        ) : (
          <>
            <label className="text-xs uppercase tracking-wide text-gray-600 mr-2">
              Update status
            </label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={c.status}
              onChange={(e) => onOpenStatusModal(e.target.value as any)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </>
        )}
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
            File key: <span className="font-mono">{c.fileKey || '—'}</span>
          </p>
          <p className="text-sm text-gray-700">Number: {label}</p>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!deleting) {
                onCloseDeleteModal();
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
                onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
                className="border px-3 py-2 w-full rounded mb-4 text-sm"
                disabled={deleting}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={onCloseDeleteModal}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirmDelete}
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

      {/* Status Modal */}
      <AnimatePresence>
        {statusModalOpen && statusTarget && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!statusSubmitting) onStatusCancel();
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
                You’re about to change the status of{' '}
                <b>Contract #{statusTarget.contractNo || statusTarget.id}</b>.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-bold border capitalize ${
                    statusColors[statusTarget.status] ||
                    'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {statusTarget.status}
                </span>
                <span className="text-gray-400">→</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-bold border capitalize ${
                    statusColors[statusToApply] ||
                    'bg-gray-100 text-gray-700 border-gray-300'
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
                  onChange={(e) => onStatusCheckboxChange(e.target.checked)}
                  className="h-4 w-4"
                />
                I understand and want to proceed.
              </label>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded border hover:bg-gray-50 text-sm"
                  disabled={statusSubmitting}
                  onClick={onStatusCancel}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50"
                  disabled={!statusConfirmChecked || statusSubmitting}
                  onClick={onStatusConfirm}
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

export default ContractDetail;
