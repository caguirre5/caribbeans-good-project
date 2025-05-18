import React, {useEffect, useState} from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowRight, faDownload } from '@fortawesome/free-solid-svg-icons';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import SatelliteMaps from './SatellitalMaps';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

const customIcon = new L.DivIcon({
  className: "",
  html: `
    <div class="w-[8px] h-[8px] bg-[#044421] border-[1px] border-white rounded-full shadow-md"></div>
  `,
  iconSize: [12, 12], // Tamaño del icono
  iconAnchor: [6, 6], // Anclaje en el centro del círculo
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const videoId = extractYouTubeVideoId(data.videoUrl);

  const downloadImage = async (url: string, name: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedImage]);

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
                <Marker key={index} position={coord} icon={customIcon}>
                  <Popup>{data.title}</Popup>
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
              <p className="text-[#044421] mt-2 font-bold" style={{ whiteSpace: 'pre-wrap' }}>
                {data.intro}
              </p>
            </div>
          )}
          <div className="mt-6">
            <p className="text-[#044421] mt-2" style={{ whiteSpace: 'pre-wrap' }}>
              {data.description}
            </p>
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

      <hr className='my-8'/>

      <div className="my-6">
        <SatelliteMaps coordinates={data.coordinates[0]} />
      </div>

      <hr className='my-8'/>

      {videoId && (
          <div className="mt-28 w-full h-[500px] "> 
            <iframe
              className=" w-full h-full rounded-lg shadow-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
      )}



      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >

          <div
            className="max-w-4xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()} // evita cerrar al hacer clic sobre la imagen
          >
            <img
              src={selectedImage}
              alt="Full image"
              className="w-full h-auto object-contain rounded-lg"
            />
            <button
              onClick={() => {
                setSelectedImage(null);
                document.body.style.overflow = 'auto'; // restaura scroll
              }}
              className="absolute top-2 right-2 bg-white text-black rounded-full px-3 py-1 text-sm shadow-md"
            >
              ✕
            </button>
          </div>
        </div>
      )}


      {/* Mostrar la sección del video si videoUrl está disponible */}

      {data.imageUrls && data.imageUrls.length > 0 && (
        <div className="w-full mt-10 px-4">
          <hr className="my-8 border-gray-600" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.imageUrls.map((url, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg shadow-lg relative h-[250px]"
              >
                {/* Imagen */}
                <img
                  src={url}
                  alt={`Farm image ${index + 1}`}
                  onClick={() => {
                    setSelectedImage(url);
                    document.body.style.overflow = 'hidden'; // bloquea scroll
                  }}                  
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110 cursor-pointer"
                />

                {/* Botón de descarga */}
                <a
                  href={url}
                  download={`image-${index + 1}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-[#044421] text-white p-2 rounded-lg text-xs shadow-lg hover:bg-[#e6a318] transition-colors"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default FarmInfo;
