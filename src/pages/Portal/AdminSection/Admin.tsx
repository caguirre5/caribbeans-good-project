import React, { useState } from 'react';
import UserList from './UserList';
import Requests from './Requests';
// import Orders from './Orders'; // Importa el nuevo componente Orders
import ProjectsList from './ProjectsList';
import ContractsDashboard from './ContractDashboard';
import TeamMembersDashboard from './TeamDashboard';
import OrdersList from './OrdersList';
import GroupsManager from './Groups';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'orders' | 'projects' | 'groups' | 'contracts' | 'teammembers'>('users'); // Agrega 'orders' como una opción

  return (
    <div 
      className=" mr-10"
      style={{ minHeight: 'calc(100vh - 15rem)' }}
    >
      <div className="text-center text-4xl font-bold py-4" style={{ fontFamily: "KingsThing", color: "#044421" }}>
        Admin panel
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
          {/* <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'orders' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button> */}
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'projects' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'groups' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'contracts' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('contracts')}
          >
            Contracts
          </button>

          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'orders' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>

          <button
            className={`block w-full text-left px-4 py-2 ${activeTab === 'teammembers' ? 'bg-gray-300' : ''}`} // Nueva pestaña
            onClick={() => setActiveTab('teammembers')}
          >
            Team members
          </button>
        </div>

        {/* Contenido principal que cambia según la pestaña seleccionada */}
        <div className="w-3/4 p-4">
          {activeTab === 'users' && <UserList />}
          {activeTab === 'requests' && <Requests />}
          {/* {activeTab === 'orders' && <Orders />} */}
          {activeTab === 'projects' && <ProjectsList />} 
          
          {activeTab === 'contracts' && <ContractsDashboard />} 
          {activeTab === 'teammembers' && <TeamMembersDashboard />} 
          {activeTab === 'orders' && <OrdersList />} 
          
          {activeTab === 'groups' && <GroupsManager />} 
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
