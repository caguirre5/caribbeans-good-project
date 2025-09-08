import React from 'react';
import GoogleSheetTable from '../../components/GoogleSheet';

const CoffeeCharts: React.FC = () => {
  const handleOrderNow = () => {
    // Pide abrir el modal pequeño en PlaceOrder
    sessionStorage.setItem('openOrderNow', 'true');
    // Cambia la pestaña en PortalHome
    window.dispatchEvent(new Event('openPlaceOrder'));
  };

  return (
    <div 
      className='flex flex-col text-center items-center text-[#044421]'
      style={{ minHeight: 'calc(100vh - 15rem)' }}
    >
      <div className='flex flex-col lg:flex-row justify-center mb-4 w-full'>
        <h1 className="text-4xl lg:text-5xl font-bold lg:mr-8" style={{fontFamily:"KingsThing"}}>
          The Coffee Charts
        </h1>
        <p className='text-sm px-10 lg:w-[30%]'>
          Use this table to browse what we currently have in stock, then use the order form below to place your order.
        </p>
      </div>

      {/* Botón grande y visible */}
      <div className="w-full flex justify-center mb-6">
        <button
          onClick={handleOrderNow}
          className="w-full md:w-auto px-10 py-4 text-white text-md font-semibold rounded-xl
                     bg-[#044421] hover:bg-[#066232] transition-transform transform hover:scale-105
                     shadow-lg"
        >
          Order now
        </button>
      </div>

      {/* Contenedor con scroll horizontal en dispositivos móviles */}
      <div className='w-full overflow-x-auto'>
        <GoogleSheetTable />
      </div>
    </div>
  );
};

export default CoffeeCharts;
