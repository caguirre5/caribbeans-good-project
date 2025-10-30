import React, { useState } from 'react';
import ContractLoader from './Contracts/Contracts';
import ContractsList from './Contracts/ContractsList';

const ContractsDashboard: React.FC = () => {
  const [activeView] = useState<'upload' | 'list'>('list');


  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Contracts</h2>
      </div>

      {activeView === 'upload' && <ContractLoader />}
      {activeView === 'list' && <ContractsList />}
    </div>
  );
};

export default ContractsDashboard;
