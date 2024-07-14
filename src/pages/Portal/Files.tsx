import React from 'react';
import Contract from '../Legal/Contract';
import PDF from '../Legal/PDFTest.pdf'

const Files: React.FC = () => {
  return (
    <div className='flex flex-col items-center text-[#044421]'>
      <h1 className="text-5xl font-bold mb-4" style={{fontFamily:"KingsThing"}}>Files</h1>
      <p>This page is under construction. Please check back soon!</p>
      <Contract pdfUrl={PDF}/>
    </div>
  );
};

export default Files;

// Similar para los otros componentes: CoffeeCharts, PlaceOrder, MyAccount, Files
