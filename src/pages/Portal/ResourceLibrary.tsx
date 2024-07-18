import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FarmInfo from '../../components/FarmInfo';

import { faSquarePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface FarmData {
  title: string;
  region: string;
  altitude: string;
  description: string;
  details: string[];
  buttonText: string;
  buttonIcon: string;
  mapImage: string;
  finca: boolean;
  color: string;
  coordinates?: [number, number];
}

const CardComponent: React.FC<{ title: string, color: string, finca: boolean, onClick: () => void }> = ({ title, color, finca, onClick }) => {
  const handleClick = () => {
    onClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div 
      className={`p-4 shadow-md lg:rounded-md flex flex-col justify-center items-center text-center text-white cursor-pointer`} 
      style={{ 
        minHeight: '300px',
        backgroundColor: color,
        fontFamily: 'KingsThing'
      }}
      onClick={handleClick}
      whileHover={{ scale: 1.05, skewX: '-5deg' }}
      transition={{ type: 'tween' }}
    >
      {finca && (
        <h3 className='text-2xl lg:text-4xl font-bold'>Finca</h3>
      )}
      <h1 className="text-4xl lg:text-6xl underline font-semibold">{title}</h1>
    </motion.div>
  );
};

interface ResourceLibraryProps {
  setActiveTab: (tab: string) => void;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ setActiveTab }) => {
  const [data, setData] = useState<FarmData[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmData | null>(null);

  useEffect(() => {
    const fetchFarmData = async () => {
      try {
        const response = await fetch('https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com/dev/caribbeangoods-content-s3/file1.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setData(data.farms as FarmData[]);
      } catch (error) {
        console.error('Failed to fetch farm data:', error);
      }
    };

    fetchFarmData();
  }, []);

  if (data.length === 0) {
    return <div>Loading...</div>;
  }

  if (selectedFarm) {
    return (
      <div className="flex flex-col items-center text-[#044421]">
        <button onClick={() => setSelectedFarm(null)} className="self-start mb-4 text-[#044421] underline">Back to all farms</button>
        <FarmInfo data={selectedFarm} setActive={setActiveTab} />
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center text-[#044421]'>
      <h1 className="text-2xl font-bold mb-4 text-center" style={{ fontFamily: "KingsThing" }}>Resource Library</h1>
      <h2 className="text-6xl lg:text-7xl font-bold mb-4 text-center" style={{ fontFamily: "KingsThing" }}>Our Farms</h2>
      <p className='w-[80%] lg:w-[500px] text-sm'>Welcome to the Caribbean Goods Resource library, where you will find all the information, photos and videos about our farms. You can download these resources to use across your marketing, website etc.</p>
      <br />
      <p className='w-[80%] lg:w-[500px] text-sm'>This is a brand new set up for us and we are keen to please, if you have a good suggestion to add to this space or some feedback you think we should know we would really appreciate your input.</p>
      
      <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 lg:gap-8 w-full max-w-5xl">
        {data.map((farm, index) => (
          <CardComponent 
            key={index} 
            title={farm.title} 
            color={farm.color} 
            finca={farm.finca}
            onClick={() => setSelectedFarm(farm)}
          />
          
        ))}
        <div 
          className={`p-4 shadow-md lg:rounded-md flex flex-col justify-center items-center text-center text-white cursor-pointer`} 
          style={{ 
            minHeight: '300px',
            backgroundColor: 'white',
            fontFamily: 'KingsThing',
            boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.1)'
          }}
          onClick={()=>{}}
        >
          <FontAwesomeIcon icon={faSquarePlus} className='text-[#e9e9e9] text-5xl'/>
        </div> 

      </div>
    </div>
  );
};

export default ResourceLibrary;
