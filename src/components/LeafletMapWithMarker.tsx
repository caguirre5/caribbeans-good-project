import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurar el icono de Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente para manejar los eventos del mapa
const MapClickHandler: React.FC<{ onMapClick: (coordinates: [number, number]) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick([lat, lng]);
    },
  });
  return null;
};

interface LeafletMapWithMarkerProps {
  center?: [number, number];
  zoom?: number;
}

const LeafletMapWithMarker: React.FC<LeafletMapWithMarkerProps> = ({ center = [15.877539, -90.358891], zoom = 7}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  const handleMapClick = (coordinates: [number, number]) => {
    setMarkerPosition(coordinates);
  };

  const handleButtonClick = () => {
    if (markerPosition) {
      console.log('Marcador en:', markerPosition);
    }
  };

  return (
    <div>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '80vh', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>Marcador en esta posición</Popup>
          </Marker>
        )}
      </MapContainer>

      <button
        onClick={handleButtonClick}
        disabled={!markerPosition}
        style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: markerPosition ? 'blue' : 'gray',
          color: 'white',
          border: 'none',
          cursor: markerPosition ? 'pointer' : 'not-allowed',
        }}
        
      >
        Imprimir coordenadas
      </button>
    </div>
  );
};

export default LeafletMapWithMarker;
