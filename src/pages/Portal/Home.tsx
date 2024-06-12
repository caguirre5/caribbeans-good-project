import React, { useState } from 'react';
import ResourceLibrary from './ResourceLibrary';
import CoffeeCharts from './CoffeeCharts';
import PlaceOrder from './PlaceOrder';
import MyAccount from './Account';
import Files from './Files';
import Header from '../../components/HeaderControls';
import Portal from './Portal';

const PortalHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'resource-library':
        return <ResourceLibrary />;
      case 'coffee-charts':
        return <CoffeeCharts />;
      case 'place-order':
        return <PlaceOrder />;
      case 'my-account':
        return <MyAccount />;
      case 'files':
        return <Files />;
      default:
        return <Portal/>;
    }
  };

  return (
    <div className="w-full">
      <Header/>
      <div className='mx-auto flex flex-col items-center justify-center'>
        <nav className="w-full flex justify-center space-x-6 py-4 border-b mt-20 bg-[#c9d3c0]">
          <button
            onClick={() => setActiveTab('home')}
            className={activeTab === 'home' ? 'text-green-700 font-semibold border-b-2 border-green-700' : 'text-gray-700'}
          >
            Portal Home
          </button>
          <button
            onClick={() => setActiveTab('resource-library')}
            className={activeTab === 'resource-library' ? 'text-green-700 font-semibold border-b-2 border-green-700' : 'text-gray-700'}
          >
            Resource Library
          </button>
          <button
            onClick={() => setActiveTab('coffee-charts')}
            className={activeTab === 'coffee-charts' ? 'text-green-700 font-semibold border-b-2 border-green-700' : 'text-gray-700'}
          >
            Coffee Charts
          </button>
          <button
            onClick={() => setActiveTab('place-order')}
            className={activeTab === 'place-order' ? 'text-green-700 font-semibold border-b-2 border-green-700' : 'text-gray-700'}
          >
            Place an Order
          </button>
          <button
            onClick={() => setActiveTab('my-account')}
            className={activeTab === 'my-account' ? 'text-green-700 font-semibold border-b-2 border-green-700' : 'text-gray-700'}
          >
            My Account
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={activeTab === 'files' ? 'text-green-700 font-semibold border-b-2 border-green-700' : 'text-gray-700'}
          >
            Files
          </button>
        </nav>
        <div className="w-[80%] p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
