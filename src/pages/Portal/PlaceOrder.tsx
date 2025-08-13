import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Modal from '../../components/ModalPopUp'; // Modal grande existente para el contrato
import { useAuth } from '../../contexts/AuthContext';
import OrderIcon from '../../assets/Icons/order2.svg';
import ReserveIcon from '../../assets/Icons/reserve1.svg';
import Contract from '../Legal/Contract'; // Componente Contract
import PlaceOrderForm from '../../components/OrderOptions';

const PlaceOrder: React.FC = () => {
  const [showLargeModal, setShowLargeModal] = useState(false); // Modal grande para el contrato
  const [showSmallModal, setShowSmallModal] = useState(false); // Modal pequeño para el mensaje

  // Funciones para cerrar los modales
  const handleCloseLargeModal = () => setShowLargeModal(false);
  const handleCloseSmallModal = () => setShowSmallModal(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const { currentUser } = useAuth();

  return (
    <div 
      className='flex flex-col items-center text-[#044421]' 
      style={{ height: 'calc(100vh - 15rem)' }}
    >
      <h1 className="text-5xl font-bold mt-10 mb-4" style={{ fontFamily: "KingsThing" }}>Place Order</h1>
      <div className='w-full flex justify-center mt-8 lg:mt-14'>

        {/* Botón de Order Now */}
        <div 
          className="cursor-pointer flex flex-col items-center justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={() => setShowSmallModal(true)} // Abre el modal pequeño
        >
          <div className="flex justify-center mb-4">
            <img src={OrderIcon} alt="Order Icon" className="text-[#cf583a] w-20 h-20 lg:w-28 lg:h-28" />
          </div>
          <h3 className="text-md font-semibold mb-2">Order now</h3>
          <p className="text-sm">Send your order details via email and get started right away.</p>
        </div>

        {/* Botón de Reserve Coffee */}
        <div 
          className="cursor-pointer flex flex-col items-center justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={() => setShowLargeModal(true)} // Abre el modal grande
        >
          <div className="flex justify-center mb-4">
            <img src={ReserveIcon} alt="Reserve Icon" className="text-[#cf583a] w-20 h-20 lg:w-28 lg:h-28" />
          </div>
          <h3 className="text-md font-semibold mb-2">Reserve coffee</h3>
          <p className="text-sm">Order coffee now from top providers and get it delivered.</p>
        </div>
      </div>

      {/* Modal pequeño para el mensaje */}
      {showSmallModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
          onClick={handleCloseSmallModal} // Cierra al hacer clic fuera
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-end">
              <button onClick={handleCloseSmallModal} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            <p className="text-lg font-semibold text-[#044421] mb-4 text-center">
              Please send your order to: 
              <a 
                href="mailto:info@caribbeangoods.co.uk" 
                className="text-blue-500 underline ml-1"
              >
                info@caribbeangoods.co.uk
              </a>
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSmallModal && (
          <Modal show={showSmallModal} onClose={handleCloseSmallModal}>
            <div className="p-6">
              <PlaceOrderForm/>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal grande para el contrato */}
      <AnimatePresence>
        {showLargeModal && (
          <Modal show={showLargeModal} onClose={handleCloseLargeModal}>
            <div className="p-6">
              <Contract currentUser={currentUser}/>
            </div>
          </Modal>
        )}
      </AnimatePresence>


      {/* Sección de tarifas de entrega estilizada */}
<div className="w-full bg-[#044421] text-white rounded-lg mt-12 px-6 py-6">
  <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm md:text-base">
    
    <div className="flex flex-col items-center justify-center">
      <p className="font-bold text-md">FREE</p>
      <p className="mt-1 text-sm leading-tight">
        Pick up <br className="hidden md:block" />
        (Loom 9–3 Tue–Sun <br className="hidden md:block" />
        or CG any day 8–6)
      </p>
    </div>

    <div className="flex flex-col items-center justify-center">
      <p className="font-bold text-md">£42.5</p>
      <p className="mt-1 text-sm">1 bag</p>
    </div>

    <div className="flex flex-col items-center justify-center">
      <p className="font-bold text-md">£75</p>
      <p className="mt-1 text-sm">2–13 bags</p>
    </div>

    <div className="flex flex-col items-center justify-center">
      <p className="font-bold text-md">FREE</p>
      <p className="mt-1 text-sm">+13 bags</p>
    </div>

  </div>
</div>

{/* Disclaimer con link al mapa */}
<div className="text-xs text-center text-gray-600 mt-2">
  Disclaimer: in approved postcodes.{" "}
  <button 
    onClick={() => setShowMapModal(true)} 
    className="text-blue-500 underline hover:text-blue-700"
  >
    View map
  </button>
</div>

      {showMapModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setShowMapModal(false)}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button 
                onClick={() => setShowMapModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <h2 className="text-lg font-semibold text-[#044421] mb-4 text-center">Approved Delivery Areas</h2>
            <img 
              src="/images/approved-postcodes-map.png" 
              alt="Approved Postcode Map" 
              className="w-full rounded-md"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default PlaceOrder;
