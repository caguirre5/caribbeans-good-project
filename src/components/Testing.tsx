import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapProps = {
  date: string;
  coordinates: [number, number];
};

const MapComponent = ({ date, coordinates }: MapProps) => {
  return (
    <div className="w-full h-full">
      <MapContainer center={coordinates} zoom={4} className="w-full h-full">
        <TileLayer
          url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
          attribution="NASA GIBS"
        />
      </MapContainer>
    </div>
  );
};

type SatelliteMapsProps = {
  coordinates: [number, number];
};

const SatelliteMaps = ({ coordinates }: SatelliteMapsProps) => {
  const mapData = [
    { date: "2004-03-02", label: "Enero 2023" },
    { date: "2014-04-21", label: "Julio 2023" },
    { date: "2024-03-02", label: "Enero 2024" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-[500px]">
      {mapData.map((map, index) => (
        <div key={index} className="flex flex-col w-full h-full">
          <h3 className="text-lg font-semibold text-center mb-2">{map.label}</h3>
          <div className="flex-grow">
            <MapComponent date={map.date} coordinates={coordinates} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SatelliteMaps;
