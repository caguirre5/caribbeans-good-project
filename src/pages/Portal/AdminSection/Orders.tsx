import React, { useEffect, useState } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { Timestamp } from 'firebase/firestore'; // Importa Timestamp

interface Contract {
  id: string;
  email: string;
  fileUrl: string;
  status: string;
  createdAt: any; // Puede ser un Timestamp o un string/Date
}

const Orders: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Completed'>('all');
  const { currentUser } = useAuth();

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/contracts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      const contracts = await response.json();

      // Convertir createdAt a Date solo si es un Timestamp
      const sortedContracts = contracts.sort((a: Contract, b: Contract) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setContracts(sortedContracts);
      setFilteredContracts(sortedContracts);
    } catch (err) {
      console.error("Error fetching contracts: ", err);
      setError("Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Filtrar contratos por estado
  const handleFilterChange = (status: 'all' | 'Pending' | 'Completed') => {
    setFilter(status);
    if (status === 'all') {
      setFilteredContracts(contracts);
    } else {
      setFilteredContracts(contracts.filter(contract => contract.status === status));
    }
  };

  const handleStatusChange = async (contractId: string, newStatus: 'Pending' | 'Completed') => {
    setUpdating((prev) => ({ ...prev, [contractId]: true }));
    
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/contracts/${contractId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
  
      if (response.ok) {
        const updatedContracts = contracts.map((contract) =>
          contract.id === contractId ? { ...contract, status: newStatus } : contract
        );
        setContracts(updatedContracts);
        setFilteredContracts(updatedContracts.filter(contract => filter === 'all' || contract.status === filter));
      } else {
        alert("Failed to update contract status");
      }
    } catch (error) {
      console.error("Error updating contract status: ", error);
      setError("Failed to update contract status.");
    } finally {
      setUpdating((prev) => ({ ...prev, [contractId]: false }));
    }
  };

  if (loading) return <p>Loading contracts...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Contracts</h2>
        <button onClick={fetchContracts} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faSyncAlt} className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="filter" className="mr-2 font-semibold">Filter by status:</label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as 'all' | 'Pending' | 'Completed')}
          className="border p-2 rounded"
        >
          <option value="all">All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {filteredContracts.length > 0 ? (
        filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            className="flex flex-col lg:flex-row lg:justify-between items-center mb-4 p-2 border-b"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
              <h3 className="text-lg font-bold">{contract.email}</h3>
              {/* Convertir a Date usando toDate() si es necesario */}
              {/* <p className="text-gray-500">Created at: {new Date(contract.createdAt).toLocaleString()}</p> */}
              <a
                href={contract.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View Contract
              </a>
            </div>
            <div className="flex gap-2">
              <select
                value={contract.status}
                onChange={(e) => handleStatusChange(contract.id, e.target.value as 'Pending' | 'Completed')}
                className="border p-2 rounded"
                disabled={updating[contract.id] === true}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
              {updating[contract.id] === true && (
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 h-6 w-6"></div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No contracts found.</p>
          <p className="text-sm text-gray-400">There are currently no contracts with the selected status.</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
