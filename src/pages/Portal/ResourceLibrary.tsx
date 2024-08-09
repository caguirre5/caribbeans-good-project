import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FarmInfo from '../../components/FarmInfo';
import Modal from '../../components/ModalPopUp';
import CoffeeFarmCMSPage from '../CMS/Components/FarmForm';
import { AnimatePresence } from 'framer-motion';

import { faSquarePlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Detail {
  [key: string]: string;
}

interface FarmData {
  title: string;
  region: string;
  altitude: string;
  intro?: string;
  description: string;
  medal?: string;
  details: Detail[];
  buttonText: string;
  prefix:string;
  color: string;
  coordinates: [number, number];
}

const CardComponent: React.FC<{ title: string, color: string, prefix: string, onClick: () => void, onDelete: () => void, isAdmin: boolean }> = ({ title, color, prefix, onClick, onDelete, isAdmin }) => {
  const handleClick = () => {
    onClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div 
      className={`relative p-4 shadow-md lg:rounded-md flex flex-col justify-center items-center text-center text-white cursor-pointer group`} 
      style={{ 
        minHeight: '300px',
        backgroundColor: color,
        fontFamily: 'KingsThing'
      }}
      onClick={handleClick}
      whileHover={{ scale: 1.05, skewX: '-5deg' }}
      transition={{ type: 'tween' }}
    >
      {isAdmin && (
        <FontAwesomeIcon 
          icon={faTrash} 
          className="absolute top-2 right-2 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-400 transition-opacity duration-300"
          onClick={(e) => { 
            e.stopPropagation();
            onDelete();
          }} 
        />
      )}
      {prefix != '' && (
        <h3 className='text-2xl lg:text-4xl font-bold'>{prefix}</h3>
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
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isAdmin = true; // Controla si el usuario es administrador

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDeleteFarm = async (farmTitle: string) => {
    try {
      const updatedData = data.filter(farm => farm.title !== farmTitle);
      setData(updatedData);

      const response = await fetch('https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com/dev/caribbeangoods-content-s3/file1.json');
      const dataJson = await response.json();

      dataJson.farms = updatedData;

      const putResponse = await fetch('http://localhost:3000/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: 'file1.json',
          fileContent: JSON.stringify(dataJson)
        })
      });

      if (putResponse.ok) {
        console.log('Farm deleted successfully!');
      } else {
        console.error('Failed to delete the farm.');
      }
    } catch (error) {
      console.error('Error deleting farm:', error);
    }
  };

  const handleAddFarm = (newFarm: FarmData) => {
    setData([...data, newFarm]);
    setSuccessMessage("Farm added successfully!");
    setTimeout(() => setSuccessMessage(null), 3000); // Clear the message after 3 seconds
  };

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

  // if (data.length === 0) {
  //   return (
  //     <div
  //       className="min-h-screen"
  //       style={{
  //         fontFamily:"KingsThing"
  //       }}
  //     >
  //       Loading...
  //     </div>
  //   );
  // }

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
      {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}
      
      <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 lg:gap-8 w-full max-w-5xl">
        {data.map((farm, index) => (
          <CardComponent 
            key={index} 
            title={farm.title} 
            color={farm.color} 
            prefix={farm.prefix}
            onClick={() => setSelectedFarm(farm)}
            onDelete={() => handleDeleteFarm(farm.title)}
            isAdmin={isAdmin}
          />
        ))}
        <motion.div 
          className={`p-4 shadow-md lg:rounded-md flex flex-col justify-center items-center text-center text-white cursor-pointer`} 
          style={{ 
            minHeight: '300px',
            backgroundColor: 'white',
            fontFamily: 'KingsThing',
            boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleOpenModal}
          whileHover={{ scale: 1.05, backgroundColor:"#f9f9f9"}}
          transition={{ type: 'tween' }}
        >
          <FontAwesomeIcon icon={faSquarePlus} className='text-[#e9e9e9] text-5xl'/>
        </motion.div> 
        <AnimatePresence>
          {showModal && (
            <Modal show={showModal} onClose={handleCloseModal}>
              <CoffeeFarmCMSPage onAddFarm={handleAddFarm} onClose={handleCloseModal} />
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResourceLibrary;
