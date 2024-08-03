import React from 'react';
import { motion } from 'framer-motion';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, children }) => {
  if (!show) return null;

  // Handler to close modal when clicking outside of the modal content
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50" onClick={handleBackgroundClick}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-9/12 lg:w-3/4 xl:w-3/4 2xl:w-3/4 max-h-screen h-4/5 overflow-y-auto"
      >
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

export default Modal;
