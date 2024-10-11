import React from 'react';
import GoogleSheetTable from '../../components/GoogleSheet';

const CoffeeCharts: React.FC = () => {
  return (
    <div className='min-h-screen flex flex-col text-center items-center text-[#044421]'>
      <div className='flex flex-col lg:flex-row justify-center mb-4 w-full'>
        <h1 className="text-4xl lg:text-5xl font-bold lg:mr-8" style={{fontFamily:"KingsThing"}}>
          The Coffee Charts
        </h1>
        <p className='text-sm px-10 lg:w-[30%]'>
          Use this table to browse what we currently have in stock, then use the order form below to place your order.
        </p>
      </div>
      {/* Contenedor con scroll horizontal en dispositivos móviles */}
      <div className='w-full overflow-x-auto'>
        <GoogleSheetTable />
      </div>
    </div>
  );
};

export default CoffeeCharts;
