import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Contract {
  id: string;
  name: string;
  email: string;
  s3Url: string;
  fileKey: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | { _seconds: number; _nanoseconds: number };
}

const ContractsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = await currentUser?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/getContracts`, {
          headers: { 'Authorization': `Bearer ${token}` },
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

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    setDeleting(true);
    try {
      const token = await currentUser?.getIdToken();

      // 1️⃣ Eliminar de S3
      const s3Response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/s3/deleteContractFile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileKey: contractToDelete.fileKey })
      });

      if (!s3Response.ok) throw new Error('Failed to delete from S3');

      // 2️⃣ Eliminar de Firestore
      const firestoreResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/contracts/${contractToDelete.id}/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!firestoreResponse.ok) throw new Error('Failed to delete from Firestore');

      // 3️⃣ Actualizar estado local
      setContracts(prev => prev.filter(c => c.id !== contractToDelete.id));

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    try {
      let seconds = timestamp.seconds ?? timestamp._seconds;
      if (!seconds) return '-';
      const date = new Date(seconds * 1000);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const lower = searchTerm.toLowerCase();
    return (
      contract.name.toLowerCase().includes(lower) ||
      contract.email.toLowerCase().includes(lower)
    );
  });

  if (loading) return <p>Loading contracts...</p>;

  return (
    <div className="overflow-x-auto relative">
      {/* Search Bar */}
      <div className="flex items-center mb-4">
        <FontAwesomeIcon icon={faSearch} className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full max-w-xs text-sm"
        />
      </div>

      {filteredContracts.length === 0 ? (
        <p>No contracts found.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">Name</th>
              <th className="border px-2 py-1 text-left">Email</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Created At</th>
              <th className="border px-2 py-1 text-center">Download</th>
              <th className="border px-2 py-1 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map(contract => (
              <tr key={contract.id}>
                <td className="border px-2 py-1">{contract.name}</td>
                <td className="border px-2 py-1">{contract.email}</td>
                <td className="border px-2 py-1 capitalize">{contract.status}</td>
                <td className="border px-2 py-1">{formatDate(contract.createdAt)}</td>
                <td className="border px-2 py-1 text-center">
                  <a
                    href={contract.s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FontAwesomeIcon icon={faDownload} size="lg" />
                  </a>
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => {
                      setContractToDelete(contract);
                      setDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Contract"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
    </div>
  );
};

export default ContractsList;
