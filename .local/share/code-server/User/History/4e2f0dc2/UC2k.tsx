import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import React from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet';

import { calculateBoundingPolygon } from '@/utils/getPolygon';

import { MapController } from './map-controller';

interface location {
  lat: number;
  long: number;
  name: string;
}

interface MapViewerProps {
  locations: location[];
  selectedLocations: location[];
  coord: LatLngTuple;
  setCoord: React.Dispatch<React.SetStateAction<LatLngTuple>>;
}

const MapViewer = ({ locations, coord, setCoord, selectedLocations }: MapViewerProps) => {
  const polygon = calculateBoundingPolygon(locations, 0.001);
  const polygonLatLngExpression = polygon.map(([lat, lng]) => [lat, lng] as LatLngTuple);

  const handleMarkerClick = (event: LeafletMouseEvent) => {
    const clickedLatLng = event.latlng;
    setCoord([clickedLatLng.lat, clickedLatLng.lng]);
  };

  const calculateCenter = (locations: location) => {
    if (locations.length === 0) {
      return null; // or some default center
    }
    const totalLat = locations.reduce((sum, location) => sum + location.lat, 0);
    const totalLong = locations.reduce((sum, location) => sum + location.long, 0);
    const averageLat = totalLat / locations.length;
    const averageLong = totalLong / locations.length;

    return { lat: averageLat, long: averageLong };
  };
  return (
    <div>
      <MapContainer
        style={{
          height: '100vh',
          width: '100vw',
        }}
        center={coord}
        zoom={2}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon color="purple" positions={polygonLatLngExpression} />
        <MapController selectedMarker={{ coord }} />
        {locations.map((location, index) => (
          <Marker
            key={index}
            position={[location.lat, location.long]}
            eventHandlers={{
              click: handleMarkerClick,
            }}
          >
            <Popup>{location.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapViewer;
