import React, { useEffect, useState } from 'react';
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

  const { currentUser } = useAuth();

  useEffect(() => {
    if (showLargeModal || showSmallModal) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showLargeModal, showSmallModal]);
  
  

  return (
    <div 
      className='flex flex-col items-center text-[#044421]' 
      // style={{ height: 'calc(100vh - 15rem)' }}
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
      {/* {showSmallModal && (
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
      )} */}

      <AnimatePresence>
        {showSmallModal && (
          <Modal show={showSmallModal} onClose={handleCloseSmallModal}>
            <div className="p-6">
            <PlaceOrderForm onClose={handleCloseSmallModal} />
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

      {/* --- Tarifa de delivery / info strip --- */}
      {/* --- Pickup & Delivery info strip (nuevo) --- */}
      <div className="w-full flex justify-center mt-10 px-4">
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 bg-gradient-to-br from-[#044421] to-[#06603a] text-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-semibold tracking-tight">Fulfilment options</h3>
              <p className="text-white/80 text-sm mt-1">
                Choose <span className="font-medium">Pick up</span> or <span className="font-medium">Delivery</span>. See locations, hours and delivery fees below.
              </p>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              {/* Pickup column */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📦</span>
                  <h4 className="text-lg font-semibold">Pickup locations</h4>
                  <span className="ml-auto inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30">
                    Free
                  </span>
                </div>

                {/* Store cards */}
                <div className="space-y-4">
                  {/* Loom Coffeehouse */}
                  <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 hover:bg-white/[0.07] transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">Loom Coffeehouse</p>
                        <p className="text-white/80 text-sm">
                          128 Maryhill Road. Glasgow. G20 7QS
                        </p>
                      </div>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=128+Maryhill+Road+Glasgow+G20+7QS"
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5"
                      >
                        Open in Maps
                      </a>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <p className="rounded-lg bg-black/10 px-3 py-2">
                        <span className="text-white/70">Tue–Fri:</span> 8am–2pm
                      </p>
                      <p className="rounded-lg bg-black/10 px-3 py-2">
                        <span className="text-white/70">Saturday:</span> 9am–3pm
                      </p>
                      <p className="rounded-lg bg-black/10 px-3 py-2">
                        <span className="text-white/70">Sunday:</span> 10am–2pm
                      </p>
                    </div>
                  </div>

                  {/* Caribbean Goods */}
                  <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 hover:bg-white/[0.07] transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">Caribbean Goods</p>
                        <p className="text-white/80 text-sm">
                          Safestore Self Storage Glasgow Central<br />
                          9 Canal St. G4 0AD
                        </p>
                      </div>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=9+Canal+St+Glasgow+G4+0AD"
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5"
                      >
                        Open in Maps
                      </a>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p className="rounded-lg bg-black/10 px-3 py-2">
                        <span className="text-white/70">Mon–Sat:</span> 8am–6pm
                      </p>
                      <p className="rounded-lg bg-black/10 px-3 py-2">
                        <span className="text-white/70">Sunday:</span> 10am–4pm
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-white/70">
                  You’ll be able to choose <span className="font-medium">Pick up</span> in the order form. Please bring your confirmation email when collecting.
                </p>
              </div>

              {/* Delivery column */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🚚</span>
                  <h4 className="text-lg font-semibold">Delivery</h4>
                </div>

                <div className="rounded-xl overflow-hidden ring-1 ring-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/10">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-medium">Order size</th>
                        <th className="px-4 py-3 font-medium">Fee (Economy)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr className="hover:bg-white/[0.04]">
                        <td className="px-4 py-3">1 bag</td>
                        <td className="px-4 py-3 font-semibold">£42.50</td>
                      </tr>
                      <tr className="hover:bg-white/[0.04]">
                        <td className="px-4 py-3">2–13 bags</td>
                        <td className="px-4 py-3 font-semibold">£75.00</td>
                      </tr>
                      <tr className="hover:bg-white/[0.04]">
                        <td className="px-4 py-3">14+ bags</td>
                        <td className="px-4 py-3 font-semibold text-emerald-300">FREE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-white/80">
                  <li>• Express (+£20) and Saturday (+£25) available at checkout.</li>
                  <li>
                    • For orders &gt; 300&nbsp;kg we apply a{" "}
                    <span className="underline decoration-white/40">pallet tariff</span> based
                    on postcode (with subsidy). Calculated in the form.
                  </li>
                  <li>
                    • If your postcode requires “POA”, we’ll contact you with an exact quote.
                  </li>
                </ul>

              </div>
            </div>
          </div>
        </div>
      </div>



    </div>
  );
};

export default PlaceOrder;
