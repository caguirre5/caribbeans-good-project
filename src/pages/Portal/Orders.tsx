import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/HeaderControls';
import Footer from '../../components/Footer';
import { Timestamp } from 'firebase/firestore'; // Importa el tipo Timestamp

interface Contract {
  id: string;
  email: string;
  fileUrl: string;
  status: string;
  createdAt: Timestamp; // Asegúrate de que createdAt sea del tipo Timestamp
}

const MyOrders: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Completed'>('all');
  const { currentUser } = useAuth(); // Esto obtiene el usuario autenticado
  
  // Función para obtener los contratos del usuario actual
  const fetchUserContracts = async () => {
    if (!currentUser) return;

    const q = query(collection(db, 'contracts'), where('userId', '==', currentUser.uid));
    
    try {
      const querySnapshot = await getDocs(q);
      const contractsData: Contract[] = [];
      querySnapshot.forEach((doc) => {
        contractsData.push({ id: doc.id, ...doc.data() } as Contract);
      });
      setContracts(contractsData);
      setFilteredContracts(contractsData); // Inicialmente muestra todos los contratos
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  useEffect(() => {
    fetchUserContracts();
  }, [currentUser]);

  // Función para manejar el cambio de filtro
  const handleFilterChange = (status: 'all' | 'Pending' | 'Completed') => {
    setFilter(status);
    if (status === 'all') {
      setFilteredContracts(contracts);
    } else {
      setFilteredContracts(contracts.filter(contract => contract.status === status));
    }
  };

  return (
    <div>
      <Header />
      <div className="p-4 my-20 mx-4 pb-20 lg:mx-40" style={{ height: 'calc(100vh - 10rem)' }}>
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        
        {/* Filtro de contratos */}
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
          <div className="overflow-y-scroll h-full border rounded-lg p-4 bg-gray-50 shadow-md">
            <ul className="space-y-4">
              {filteredContracts.map((contract) => (
                <li key={contract.id} className="border p-4 rounded-lg shadow-md bg-white">
                  <p className="font-semibold">Email: {contract.email}</p>
                  <p>Status: {contract.status}</p>
                  {/* Convierte el Timestamp a una fecha con .toDate() */}
                  <p>Created At: {new Date(contract.createdAt.toDate()).toLocaleString()}</p>
                  <a
                    href={contract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    View Contract
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No contracts found.</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;
