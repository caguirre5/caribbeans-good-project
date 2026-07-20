import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faFileContract, faUpload } from '@fortawesome/free-solid-svg-icons';
import ContractLoader from './Contracts/Contracts';
import ContractControl from './Contracts/ContractControlV2';
import ContractsList from './Contracts/ContractsList';

const ContractsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'upload' | 'list' | 'control'>('list');

  const tabClass = (id: 'upload' | 'list' | 'control') =>
    activeView === id
      ? 'py-2 px-2 font-semibold text-sm whitespace-nowrap inline-flex items-center gap-2 border-b-2 border-[#174B3D] text-[#174B3D]'
      : 'py-2 px-2 font-semibold text-sm whitespace-nowrap inline-flex items-center gap-2 text-gray-500 hover:text-[#174B3D]';

  return (
    <div className='min-w-0 max-w-full overflow-hidden bg-white p-4 rounded-lg shadow-md'>
      <div className='flex flex-col gap-3 mb-4 border-b pb-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-lg font-bold text-gray-900'>Contracts</h2>
          <p className='text-sm text-gray-500'>
            Manage files, reservations, dispatches and monthly fulfilment.
          </p>
        </div>
      </div>

      <div className='flex gap-4 mb-4 border-b overflow-x-auto'>
        {[
          { id: 'list' as const, label: 'List', icon: faFileContract },
          { id: 'control' as const, label: 'Control', icon: faCalendarDays },
          { id: 'upload' as const, label: 'Upload', icon: faUpload },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={tabClass(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'upload' && <ContractLoader />}
      {activeView === 'control' && <div className='min-w-0 max-w-full overflow-hidden'><ContractControl /></div>}
      {activeView === 'list' && <ContractsList />}
    </div>
  );
};

export default ContractsDashboard;

