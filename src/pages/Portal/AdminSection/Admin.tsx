import React, { useState } from 'react';
import UserList from './UserList';
import Requests from './Requests';
// import Orders from './Orders'; // Importa el nuevo componente Orders
import ProjectsList from './ProjectsList';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'orders' | 'projects'>('users'); // Agrega 'orders' como una opción

  return (
    <div 
      className=" w-[80%] "
      style={{ minHeight: 'calc(100vh - 15rem)' }}
    >
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
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'orders' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'projects' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
        </div>

        {/* Contenido principal que cambia según la pestaña seleccionada */}
        <div className="w-3/4 p-4">
          {activeTab === 'users' && <UserList />}
          {activeTab === 'requests' && <Requests />}
          {/* {activeTab === 'orders' && <Orders />} */}
          {activeTab === 'projects' && <ProjectsList />} 
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
