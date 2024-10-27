import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowRight } from '@fortawesome/free-solid-svg-icons';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Detail {
  [key: string]: string;
}

interface FarmData {
  id: string;
  title: string;
  region: string;
  altitude: string;
  intro?: string;
  description: string;
  medal?: string;
  details: Detail[];
  buttonText: string;
  prefix: string;
  color: string;
  coordinates: [number, number][]; // Cambiado a un array de coordenadas
  imageUrls?: string[];
  videoUrl?: string;
}

interface FarmInfoProps {
  data: FarmData;
  setActive: (tab: string) => void;
}

const extractYouTubeVideoId = (url : string | undefined) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url?.match(regex);
  return match ? match[1] : null; // Retorna el ID del video o null si no coincide
};

const FarmInfo: React.FC<FarmInfoProps> = ({ data, setActive }) => {
  const videoId = extractYouTubeVideoId(data.videoUrl);
  return (
    <div className="py-12 w-full justify-center items-center">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-3 items-start">
        <div className="col-span-1 p-7 rounded-xl shadow-lg">
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
          <div className="mt-6">
            <MapContainer
              center={[15.877539, -90.368891]}
              zoom={7}
              style={{ height: '60vh', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              />
              {data.coordinates.map((coord, index) => (
                <Marker key={index} position={coord}>
                  <Popup>
                    {data.title}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="mt-6">
            {data.details.map((detail, index) => (
              <div key={index} className="mt-2">
                <p className="text-[#044421]">
                  <span className="font-semibold">{detail.key}: </span>
                  {detail.value}
                </p>
              </div>
            ))}
          </div>

        </div>

        <div className="col-span-2 p-7">
          <div className="col-span-3 text-center lg:text-left">
            <div className="flex items-center lg:justify-between justify-center">
              <h1 className="text-4xl lg:text-6xl text-center font-bold text-[#044421] underline" style={{ fontFamily: "KingsThing" }}>
                {data.title}
              </h1>
              {data.medal && (
                <div className="ml-10 lg:w-[150px] lg:h-[150px] p-4 rounded-full flex justify-center items-center bg-[#e6a318]">
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
            className="bg-[#044421] p-4 flex justify-center items-center w-full lg:w-64 rounded-full cursor-pointer mt-8 main-home-texticonbutton"
            onClick={() => {
              setActive('coffee-charts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <p className="text-white text-xs tracking-widest">{data.buttonText}</p>
            <FontAwesomeIcon className="text-white ml-2" icon={faLongArrowRight} />
          </button>
        </div>
      </div>

      {/* Mostrar la sección del video si videoUrl está disponible */}
      {data.videoUrl && data.videoUrl !== '' && (
        <>
          <hr className="my-8" />
          <div className="w-full px-8 h-[640px] overflow-hidden relative pointer-events-none">
            <iframe
              className="w-full h-full object-cover"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube video"
            />
          </div>
        </>
      )}

      {/* Mostrar la galería de imágenes si hay imágenes */}
      {data.imageUrls && data.imageUrls.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6">
          <hr className='my-8'/>
          <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-4 mt-4">
            {data.imageUrls.map((url, index) => (
              <div key={index} className="overflow-hidden rounded-lg shadow-lg" style={{ flex: '1 0 auto', height: '250px' }}>
                <img
                  src={url}
                  alt={`Farm image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmInfo;
