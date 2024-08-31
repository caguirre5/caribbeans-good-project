import React, { useState } from 'react';
import UserList from './UserList';
import Requests from './Requests';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');

  return (
    <div className="min-h-screen w-[80%] ">
      <div className="text-center text-4xl font-bold py-4" style={{ fontFamily: "KingsThing", color: "#044421" }}>
        DASHBOARD
      </div>
      <div className="flex bg-gray-100">
        {/* Sidebar con las pestañas */}
        <div className="w-1/4 bg-white shadow-lg">
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'users' ? 'bg-gray-300' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'requests' ? 'bg-gray-300' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests
          </button>
        </div>

        {/* Contenido principal que cambia según la pestaña seleccionada */}
        <div className="w-3/4 p-4">
          {activeTab === 'users' ? <UserList /> : <Requests />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
