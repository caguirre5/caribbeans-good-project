import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';

interface Contract {
  id: string;
  name: string;
  email: string;
  s3Url: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | { _seconds: number; _nanoseconds: number };
}

const ContractsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="overflow-x-auto">
      {/* Barra de búsqueda */}
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
              <th className="border px-2 py-1 text-left">Download</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map(contract => (
              <tr key={contract.id}>
                <td className="border px-2 py-1">{contract.name}</td>
                <td className="border px-2 py-1">{contract.email}</td>
                <td className="border px-2 py-1 capitalize">{contract.status}</td>
                <td className="border px-2 py-1">{formatDate(contract.createdAt)}</td>
                <td className="border px-2 py-1">
                  <a
                    href={contract.s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faDownload} size="lg" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ContractsList;
