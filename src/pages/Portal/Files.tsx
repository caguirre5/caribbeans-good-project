import React, { useState } from 'react';
// import Contract from '../Legal/Contract';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence } from 'framer-motion';
import Modal from '../../components/ModalPopUp';

const Files: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className='flex flex-col items-center text-[#044421]'>
      <h1 className="text-5xl font-bold mb-4" style={{fontFamily:"KingsThing"}}>Files</h1>
      <p>This page is under construction. Please check back soon!</p>
      <div className="cursor-pointer flex flex-col items-center lg:justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={handleOpenModal}
        >
          <div className="flex justify-center mb-4">
            <FontAwesomeIcon icon={faFileContract} className="text-[#cf583a] w-10 h-10" />
          </div>
          <h3 className="text-md font-semibold mb-2">Coffee Supply Agreement</h3>
          <p className="text-sm">Fill the form and generate the coffee supply agreement you need.</p>
        </div>
      
      <AnimatePresence>
          {showModal && (
            <Modal show={showModal} onClose={handleCloseModal}>
              {/* <Contract/> */}
              <div/>
            </Modal>
          )}
        </AnimatePresence>
    </div>
  );
};

export default Files;

