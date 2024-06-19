import React from 'react';
import LeafletMapComponent from './LeafletMapComponent';
import { TextIconButton } from './Buttons';

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
  coordinates:[number, number];
}

interface FarmInfoProps {
  data: FarmData;
}

const FarmInfo: React.FC<FarmInfoProps> = ({ data }) => {
  return (
    <div className="bg-gray-100 py-12 px-4 lg:px-24 justify-center items-center">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-6xl font-bold text-green-900 underline" style={{fontFamily:"KingsThing"}}>{data.title}</h1>
          <p className="text-green-900 mt-2">
            {data.description}
          </p>
          <div className="mt-6 text-left space-y-4">
            <div className="flex items-center">
              <span className="text-green-900 font-semibold">Region:</span>
              <span className="ml-2 text-green-700">{data.region}</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-900 font-semibold">Altitude:</span>
              <span className="ml-2 text-green-700">{data.altitude}</span>
            </div>
          </div>
          <div className="mt-8 space-y-6">
            {data.details.map((detail, index) => (
              <p className="text-green-900" key={index}>{detail}</p>
            ))}
          </div>
          <div className="mt-8">
            <TextIconButton text="Price & Availability" blank="https://treesforlife.org.uk/groves/474546/"/>
          </div>
        </div>
        <div className="flex justify-center lg:justify-center">
          <LeafletMapComponent coordinates={[14.556650,-90.944061]} popupDescription={data.title}/>
        </div>
      </div>
    </div>
  );
};

export default FarmInfo;
