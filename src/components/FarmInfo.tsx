import React from 'react';

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
}

interface FarmInfoProps {
  data: FarmData;
}

const FarmInfo: React.FC<FarmInfoProps> = ({ data }) => {
  return (
    <div className="bg-gray-100 py-12 px-4 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold text-green-900">{data.title}</h1>
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
            <button className="bg-green-700 text-white py-2 px-4 rounded-full hover:bg-green-800 flex items-center">
              <img src={data.buttonIcon} alt="Price & Availability" className="w-6 h-6 mr-2" />
              {data.buttonText}
            </button>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <img src={data.mapImage} alt="Guatemala Map" className="w-2/3 lg:w-2/3" />
        </div>
      </div>
    </div>
  );
};

export default FarmInfo;
