import React from 'react';
import LeafletMapComponent from './LeafletMapComponent';
import { TextIconButton } from './Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowRight } from '@fortawesome/free-solid-svg-icons';

interface FarmData {
  title: string;
  region: string;
  altitude: string;
  description: string;
  details: string[];
  buttonText: string;
  buttonIcon: string;
  mapImage: string;
  finca:boolean;
  color:string;
  coordinates?:[number, number];
}

interface FarmInfoProps {
  data: FarmData;
  setActive: (tab:string) => void;
}

const FarmInfo: React.FC<FarmInfoProps> = ({ data, setActive }) => {
  return (
    <div className="bg-gray-100 py-12 px-4 lg:px-24 justify-center items-center">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-6xl font-bold text-[#044421] underline" style={{fontFamily:"KingsThing"}}>{data.title}</h1>
          <p className="text-[#044421] mt-2">
            {data.description}
          </p>
          <div className="mt-6 text-left space-y-4">
            <div className="flex items-center">
              <span className="text-[#044421] font-semibold">Region:</span>
              <span className="ml-2 text-[#044421]">{data.region}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#044421] font-semibold">Altitude:</span>
              <span className="ml-2 text-[#044421]">{data.altitude}</span>
            </div>
          </div>
          <div className="mt-8 space-y-6">
            {data.details.map((detail, index) => (
              <p className="text-[#044421]" key={index}>{detail}</p>
            ))}
          </div>
          <button
            className="bg-[#044421] p-4 flex justify-center items-center w-64 rounded-full cursor-pointer mt-8 main-home-texticonbutton"
            onClick={() => {
              setActive('coffee-charts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <p className="text-white text-xs tracking-widest">
              Price & Availability
            </p>
            <FontAwesomeIcon className="text-white ml-2" icon={faLongArrowRight} />
          </button>
        </div>
        <div className="flex justify-center lg:justify-center">
          <LeafletMapComponent coordinates={[14.556650,-90.944061]} center={[15.877539, -90.358891]} popupDescription={data.title} zoom={7} type='radius'/>
        </div>
      </div>
    </div>
  );
};

export default FarmInfo;
