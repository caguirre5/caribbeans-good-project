import React, {useState} from 'react';
import OrderForm from '../Forms/OrderForm';
import ReserveForm from '../Forms/ReserveForm';
import { AnimatePresence } from 'framer-motion';
import Modal from '../../components/ModalPopUp';
import Contract from '../Legal/Contract';

import OrderIcon from '../../assets/Icons/reserve1.svg'

const PlaceOrder: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // const handleOptionClick = (option: string) => {
  //   setSelectedOption(option);
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // };

  const handleBackClick = () => {
    setSelectedOption(null);
  };

  if (selectedOption === 'order-now') {
    return <OrderForm onBack={handleBackClick}/>;
  }

  if (selectedOption === 'reserve') {
    return <ReserveForm onBack={handleBackClick}/>
  }

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div 
      className='flex flex-col items-center text-[#044421]' 
      style={{ height: 'calc(100vh - 15rem)' }}
    >
      <h1 className="text-5xl font-bold mt-10 mb-4" style={{fontFamily:"KingsThing"}}>Place Order</h1>
      <div className='w-full flex justify-center mt-8 lg:mt-14'>

        {/* <div className="cursor-pointer flex flex-col items-center lg:justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={() => handleOptionClick('order-now')}
        >
          <div className="flex justify-center mb-4">
            <FontAwesomeIcon icon={faCartShopping} className="text-[#cf583a] w-10 h-10" />
          </div>
          <h3 className="text-md font-semibold mb-2">Order now</h3>
          <p className="text-sm">Order coffee now from top providers and get it delivered.</p>
        </div> */}

        <div className="cursor-pointer flex flex-col items-center justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={handleOpenModal}
        >
          <div className="flex justify-center mb-4">
            {/* <FontAwesomeIcon icon={faCartShopping} className="text-[#cf583a] w-10 h-10" /> */}
            <img src={OrderIcon} alt={`icon`} className="text-[#cf583a] w-20 h-20 lg:w-28 lg:h-28" />
          </div>
          <h3 className="text-md font-semibold mb-2">Order now</h3>
          <p className="text-sm">Order coffee now from top providers and get it delivered.</p>
        </div>
      </div>
      <AnimatePresence>
        {showModal && (
          <Modal show={showModal} onClose={handleCloseModal}>
            <Contract/>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaceOrder;

// Similar para los otros componentes: CoffeeCharts, PlaceOrder, MyAccount, Files
