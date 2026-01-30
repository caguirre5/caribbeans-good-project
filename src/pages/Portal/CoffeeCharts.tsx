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
      className='flex flex-col text-center mt-8 items-center text-[#044421]'
      style={{ minHeight: 'calc(100vh - 15rem)' }}
    >
      <div className="flex flex-col lg:flex-row justify-center mb-4 w-full items-center gap-4">
        <h1
          className="text-4xl lg:text-5xl font-bold lg:mr-8"
          style={{ fontFamily: "KingsThing" }}
        >
          Prices & availability
        </h1>

        {/* ✅ Reemplazo del texto por insignia + explicación */}
        <div className="px-10 lg:w-[34%] text-left flex items-start gap-3">

          <p className="text-sm text-[#044421]/80 leading-snug">
            Some varieties are exclusive to specific groups. They will be marked
            with this badge in the table. 
          <span className="text-[10px] font-semibold mx-2 px-2 py-[2px] rounded bg-yellow-100 text-yellow-800 border border-yellow-400 shrink-0 mt-[2px]">
            EXCLUSIVE
          </span>
          </p>
        </div>
      </div>

      {/* Botón grande y visible */}
      <div className="lg:w-full flex justify-center my-6">
        <button
          onClick={handleOrderNow}
          className="w-full md:w-auto px-10 py-2 lg:py-4 text-white text-sm lg:text-md font-semibold rounded-full
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
