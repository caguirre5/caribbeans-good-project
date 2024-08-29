import React, { useState, useEffect } from 'react';
import Modal from '../../components/ModalPopUp'; // Asegúrate de que esta ruta sea correcta
import { AnimatePresence } from 'framer-motion';
import CookiesInfo from './CookieInfo';

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Verificar si el consentimiento ya ha sido dado
    const consent = localStorage.getItem('cookies-accepted');
    if (!consent) {
      setShowBanner(true);
      // Deshabilitar el scroll
      document.body.style.overflow = 'hidden';
    }

    // Limpiar el efecto si el componente se desmonta
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAcceptAll = () => {
    // Guardar el consentimiento en localStorage
    localStorage.setItem('cookies-accepted', 'true');
    setShowBanner(false);
    // Habilitar el scroll nuevamente
    document.body.style.overflow = '';
  };

  const handleLearnMore = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-end justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white w-full  p-6 px-8 flex flex-col md:flex-row justify-between items-center rounded-lg shadow-lg m-4">
          <div className="text-start w-full md:w-auto mb-4 md:mb-0 mr-8">
            <p className="text-[#044421] font-bold text-lg mb-2">
              Cookie Consent
            </p>
            <p className="text-sm text-gray-600">
              By clicking "Accept All Cookies", you agree to the storing of cookies on your device to enhance site navigation, analyze site usage, and assist in our marketing efforts.
            </p>
          </div>
          <div className="flex justify-end space-x-4 w-full md:w-auto">
            <button
              onClick={handleLearnMore}
              className=" text-black border-[#044421] border-solid border w-40 px-4 py-2 rounded hover:bg-gray-300"
            >
              Learn more
            </button>
            <button
              onClick={handleAcceptAll}
              className="bg-[#044421] text-white w-40 px-4 py-2 rounded hover:bg-[#eab208dd]"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal show={showModal} onClose={handleCloseModal}>
            <CookiesInfo />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default CookieConsentBanner;
