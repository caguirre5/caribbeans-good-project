import React, { useState } from 'react';
import ResourceLibrary from './ResourceLibrary';
import CoffeeCharts from './CoffeeCharts';
import PlaceOrder from './PlaceOrder';
import Files from './Files';
import Header from '../../components/HeaderControls';
import Footer from '../../components/Footer';
import Portal from './Portal';

const PortalHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'resource-library':
        return <ResourceLibrary setActiveTab={setActiveTab}/>;
      case 'coffee-charts':
        return <CoffeeCharts />;
      case 'place-order':
        return <PlaceOrder />;
      case 'services':
        return <Files />;
      default:
        return <Portal />;
    }
  };

  return (
    <div className="w-full">
      <Header />
      <div className={` flex flex-col items-center justify-center mt-20`}
      >
        {/* Dropdown para móviles */}
        <div className="w-full flex justify-center py-4 border-b bg-[#c9d3c0] lg:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="bg-[#c9d3c0] text-gray-700 p-2 rounded-md"
          >
            <option value="home">Portal Home</option>
            <option value="resource-library">Resource Library</option>
            <option value="coffee-charts">Coffee Charts</option>
            <option value="place-order">Place an Order</option>
            <option value="files">Services</option>
          </select>
        </div>

        {/* Navbar para pantallas grandes */}
        <nav className="hidden w-full justify-center space-x-6 py-4 border-b bg-[#c9d3c0] lg:flex">
          <button
            onClick={() => setActiveTab('home')}
            className={activeTab === 'home' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Portal Home
          </button>
          <button
            onClick={() => setActiveTab('resource-library')}
            className={activeTab === 'resource-library' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Resource Library
          </button>
          <button
            onClick={() => setActiveTab('coffee-charts')}
            className={activeTab === 'coffee-charts' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Coffee Charts
          </button>
          <button
            onClick={() => setActiveTab('place-order')}
            className={activeTab === 'place-order' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Place an Order
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={activeTab === 'services' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Services
          </button>
        </nav>

        <div className="mt-8 lg:mt-8 mb-[80px] flex justify-center">
          {renderContent()}
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default PortalHome;
