import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Necesitas configurar el icono de Leaflet, ya que por defecto no se carga correctamente en algunos entornos
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Define la posición como una tupla con dos elementos de tipo number
interface LeafletMapComponentProps {
  coordinates: [number, number];
  popupDescription:string;
  center:[number, number];
  zoom:number;
  type:"marker"|"radius";
}
// const position: [number, number] = [55.860910, -4.241640];

const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({ coordinates, popupDescription, center, zoom, type }) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '60vh', width: '100%' }}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      />
      {type == "marker" ? (
        <Marker position={coordinates}>
          <Popup>
            {popupDescription}
          </Popup>
        </Marker>
      ): (
        <Circle center={coordinates} radius={20000}>
          <Popup>
            {popupDescription}
          </Popup>
        </Circle>
      )}
      
    </MapContainer>
  );
};

export default LeafletMapComponent;
