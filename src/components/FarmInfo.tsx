import React from 'react';
import LeafletMapComponent from './LeafletMapComponent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowRight } from '@fortawesome/free-solid-svg-icons';

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

interface FarmInfoProps {
  data: FarmData;
  setActive: (tab: string) => void;
}

const FarmInfo: React.FC<FarmInfoProps> = ({ data, setActive }) => {
  return (
    <div className="py-12 px-4 lg:px-24 justify-center items-center">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        <div className="col-span-1  p-7 rounded-xl shadow-lg">
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
          <div className="mt-6 ">
            <LeafletMapComponent coordinates={data.coordinates} center={[15.877539, -90.358891]} popupDescription={data.title} zoom={7} type='radius' />
          </div>
          <div className="mt-6">
            {data.details.map((detail, index) => (
              <div key={index} className="mt-2">
                {Object.entries(detail).map(([key, value]) => (
                  <p className="text-[#044421]" key={key}>
                    <span className="font-semibold">{key}: </span>{value}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <div className="col-span-3 text-center lg:text-left">
            <div className="flex items-center justify-between">
              <h1 className="text-6xl font-bold text-[#044421] underline" style={{ fontFamily: "KingsThing" }}>{data.title}</h1>
              {data.medal && (
                <div className="mr-12 w-[150px] h-[150px] p-4 rounded-full flex justify-center items-center bg-[#e6a318]">
                  <span className="text-white text-center font-semibold text-xs">{data.medal}</span>
                </div>
              )}
            </div>
          </div>
          {data.intro && (
            <div className="mt-6">
              <p className="text-[#044421] mt-2 font-bold">{data.intro}</p>
            </div>
          )}
          <div className="mt-6">
            <p className="text-[#044421] mt-2">{data.description}</p>
          </div>
          <button
            className="bg-[#044421] p-4 flex justify-center items-center w-64 rounded-full cursor-pointer mt-8 main-home-texticonbutton"
            onClick={() => {
              setActive('coffee-charts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <p className="text-white text-xs tracking-widest">
              {data.buttonText}
            </p>
            <FontAwesomeIcon className="text-white ml-2" icon={faLongArrowRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmInfo;
