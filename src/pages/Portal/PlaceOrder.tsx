import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {useState} from 'react';
import { faCalendarCheck, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import OrderForm from '../Forms/OrderForm';

const PlaceOrder: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackClick = () => {
    setSelectedOption(null);
  };

  if (selectedOption === 'order-now') {
    return <OrderForm onBack={handleBackClick}/>;
  }

  if (selectedOption === 'reserve') {
    return <div>Hola</div>;
  }

  return (
    <div 
      className='flex flex-col items-center text-[#044421] h-screen'
    >
      <h1 className="text-5xl font-bold mb-4" style={{fontFamily:"KingsThing"}}>Place Order</h1>
      <div className='w-full flex justify-center '>

        <div className="cursor-pointer flex flex-col items-center lg:justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={() => handleOptionClick('order-now')}
        >
          <div className="flex justify-center mb-4">
            <FontAwesomeIcon icon={faCartShopping} className="text-[#cf583a] w-10 h-10" />
          </div>
          <h3 className="text-md font-semibold mb-2">Order now</h3>
          <p className="text-sm">Order coffee now from top providers and get it delivered.</p>
        </div>

        <div className="cursor-pointer flex flex-col items-center lg:justify-center p-2 py-4 lg:p-6 text-center w-[50%] h-[260px] border border-white lg:w-[210px] rounded-md hover:border-[#c9d3c0]hover:bg-[#c9d3c0]hover:text-white transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
          onClick={() => handleOptionClick('reserve')}
        >
          <div className="flex justify-center mb-4">
            <FontAwesomeIcon icon={faCalendarCheck} className="text-[#cf583a] w-10 h-10" />
          </div>
          <h3 className="text-md font-semibold mb-2">Reserve</h3>
          <p className="text-sm">Reserve your coffee and plan your deliveries in advance.</p>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;

// Similar para los otros componentes: CoffeeCharts, PlaceOrder, MyAccount, Files
