import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type MapProps = {
  date: string;
  coordinates: [number, number];
  showMarker: boolean;
};
// const customIcon = new L.DivIcon({
//   className: "",
//   html: `
//     <div class="w-[180px] h-[180px] bg-none border-[2px] border-white rounded-full shadow-md"></div>
//   `,
//   iconSize: [90, 90], // Tamaño del icono
//   iconAnchor: [90, 90], // Anclaje en el centro del círculo
// });
const customIcon = new L.DivIcon({
  className: "",
  html: `<div class="w-[12px] h-[12px] bg-[#e6a318] border-[1px] border-white rounded-full shadow-md"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const MapComponent = ({ date, coordinates, showMarker }: MapProps) => {
  return (
    <div className="w-full h-full">
      <MapContainer center={coordinates}
        zoom={9}
        className="w-full h-full rounded-md"
        dragging={false} 
        scrollWheelZoom={false} 
        doubleClickZoom={false} 
        touchZoom={false} 
        zoomControl={false}  
      >
        <TileLayer
          url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
          attribution="NASA GIBS"
        />
        {showMarker && (
          <Marker position={coordinates} icon={customIcon}>
            <Popup>Farm location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

type SatelliteMapsProps = {
  coordinates: [number, number];
};

const SatelliteMaps = ({ coordinates }: SatelliteMapsProps) => {
  const [showMarker, setShowMarker] = useState(true);

  const mapData = [
    { date: "2022-03-06", label: "2022" },
    { date: "2023-02-07", label: "2023" },
    { date: "2024-02-10", label: "2024" },
  ];

  return (
    <div className=" w-full h-[50vh]">
      <button
        className="bg-[#044421] text-white text-xs tracking-widest p-4 flex justify-center items-center w-full lg:w-64 rounded-full cursor-pointer mb-8 main-home-texticonbutton"
        onClick={() => setShowMarker((prev) => !prev)}
      >
        {showMarker ? "Hide" : "Show"} farm marker
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full">
        {mapData.map((map, index) => (
          <div key={index} className="flex flex-col w-full h-full">
            <h3 className="text-lg font-semibold text-center mb-2">{map.label}</h3>
            <div className="flex-grow">
              <MapComponent date={map.date} coordinates={coordinates} showMarker={showMarker} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SatelliteMaps;



