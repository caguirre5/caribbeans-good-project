import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faList } from '@fortawesome/free-solid-svg-icons';
import ContractLoader from './Contracts/Contracts';
import ContractsList from './Contracts/ContractsList';

const ContractsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'upload' | 'list'>('list');

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Contracts</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          onClick={() => setActiveView(activeView === 'list' ? 'upload' : 'list')}
        >
          <FontAwesomeIcon icon={activeView === 'list' ? faUpload : faList} />
          {activeView === 'list' ? 'Upload Contract' : 'View Contracts'}
        </button>
      </div>

      {activeView === 'upload' && <ContractLoader />}
      {activeView === 'list' && <ContractsList />}
    </div>
  );
};

export default ContractsDashboard;
