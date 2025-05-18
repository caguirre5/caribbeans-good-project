import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Modal from '../../components/ModalPopUp'; // Modal grande existente para el contrato
import { useAuth } from '../../contexts/AuthContext';
import OrderIcon from '../../assets/Icons/order2.svg';
import ReserveIcon from '../../assets/Icons/reserve1.svg';
import Contract from '../Legal/Contract'; // Componente Contract

const PlaceOrder: React.FC = () => {
  const [showLargeModal, setShowLargeModal] = useState(false); // Modal grande para el contrato
  const [showSmallModal, setShowSmallModal] = useState(false); // Modal pequeño para el mensaje

  // Funciones para cerrar los modales
  const handleCloseLargeModal = () => setShowLargeModal(false);
  const handleCloseSmallModal = () => setShowSmallModal(false);

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
    </div>
  );
};

export default PlaceOrder;
