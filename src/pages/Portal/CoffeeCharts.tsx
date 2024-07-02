import React from 'react';
// import GoogleSheetTable from '../../components/TableData';
import GoogleSheetTable from '../../components/GoogleSheet';

const CoffeeCharts: React.FC = () => {
  return (
    <div className='flex flex-col items-center text-[#044421]'>
      <div className='flex flex-col lg:flex-row justify-center mb-4'>
        <h1 className="text-5xl font-bold mr-8" style={{fontFamily:"KingsThing"}}>The Coffee Charts</h1>
        <p className='text-sm  w-[30%]'>Use this table to browse what we currently have in stock,  then use the order form below to place your order.</p>
      </div>
      <GoogleSheetTable/>
    </div>
  );
};

export default CoffeeCharts;

// Similar para los otros componentes: CoffeeCharts, PlaceOrder, MyAccount, Files
