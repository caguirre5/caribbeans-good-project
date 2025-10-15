import React, { useState, useEffect } from 'react';
import ResourceLibrary from './ResourceLibrary';
import CoffeeCharts from './CoffeeCharts';
import PlaceOrder from './PlaceOrder';
import Header from '../../components/HeaderControls';
import Footer from '../../components/Footer';
import Portal from './Portal';
// import Files from './Files';
import Dashboard from './AdminSection/Admin';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; 

const PortalHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setIsAdmin(userData?.roles?.includes('admin') || false);
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
        }
      }
    };

    fetchUserRoles();
  }, [currentUser]);

  useEffect(() => {
    const handler = () => setActiveTab('place-order');
    window.addEventListener('openPlaceOrder', handler);
    return () => window.removeEventListener('openPlaceOrder', handler);
  }, []);

  useEffect(() => {
    const handler = () => setActiveTab('coffee-charts');
    window.addEventListener('openCoffeeCharts', handler);
    return () => window.removeEventListener('openCoffeeCharts', handler);
  }, []);  
  

  const renderContent = () => {
    switch (activeTab) {
      case 'resource-library':
        return <ResourceLibrary setActiveTab={setActiveTab} />;
      case 'coffee-charts':
        return <CoffeeCharts />;
      case 'place-order':
        return <PlaceOrder />;
      // case 'services':
      //   return <Files />;
      case 'admin':
        return isAdmin ? <Dashboard /> : null; // Solo renderiza el Dashboard si es admin
      default:
        return <Portal setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="w-full">
      <Header />
      <div className={`flex flex-col items-center justify-center mt-20`}>
        {/* Dropdown para móviles */}
        <div className="w-full flex justify-center py-4 border-b bg-[#c9d3c0] lg:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="bg-[#c9d3c0] text-gray-700 p-2 rounded-md"
          >
            <option value="home">Portal Home</option>
            <option value="resource-library">Resource Library</option>
            <option value="coffee-charts">Prices & Availability</option>
            <option value="place-order">Place an Order</option>
            {/* <option value="services">Services</option> */}
            {isAdmin && <option value="admin">Users</option>}
          </select>
        </div>

        {/* Navbar para pantallas grandes */}
        <nav className="hidden w-full justify-center space-x-6 h-14 border-b bg-[#c9d3c0] lg:flex">
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
            Farm information
          </button>
          <button
            onClick={() => setActiveTab('coffee-charts')}
            className={activeTab === 'coffee-charts' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Prices & Availability
          </button>
          <button
            onClick={() => setActiveTab('place-order')}
            className={activeTab === 'place-order' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Place an Order
          </button>
          {/* <button
            onClick={() => setActiveTab('services')}
            className={activeTab === 'services' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
          >
            Services
          </button> */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={activeTab === 'admin' ? 'text-[#044421] font-semibold border-t-2 border-[#044421]' : 'text-[#044421]'}
            >
              Admin
            </button>
          )}
        </nav>

        <div className="w-full mt-8 lg:mt-8 mb-[80px] flex justify-center">
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PortalHome;
