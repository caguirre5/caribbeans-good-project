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

// 👇 nuevo import
import SampleForm from '../../components/SampleForm';

const PortalHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // 👇 controla el modal de samples
  const [showSampleModal, setShowSampleModal] = useState(false);

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

      {/* 🔘 BOTÓN FLOTANTE REQUEST SAMPLE */}
      <button
        type="button"
        onClick={() => setShowSampleModal(true)}
        className="
          fixed 
          bottom-4 
          right-4 
          z-40 
          flex 
          items-center 
          gap-2 
          px-4 
          py-3 
          rounded-full 
          bg-[#044421] 
          text-white 
          shadow-lg 
          hover:bg-[#06603a]
          focus:outline-none 
          focus:ring-2 
          focus:ring-offset-2 
          focus:ring-[#044421]
          text-sm 
          sm:text-base
        "
      >
        <span className="text-lg">📦</span>
        <span className="font-semibold hidden sm:inline">Request samples</span>
        <span className="font-semibold sm:hidden">Samples</span>
      </button>

      {/* 🧊 MODAL CON EL SAMPLE FORM */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Request coffee samples
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Contenido modal */}
            <div className="p-4">
              {/* Si tu SampleForm acepta onClose, puedes pasarla como prop */}
              {/* <SampleForm onClose={() => setShowSampleModal(false)} /> */}
              <SampleForm />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PortalHome;
