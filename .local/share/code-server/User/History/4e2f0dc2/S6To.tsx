import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import {
  LatLngTuple,
  LeafletMouseEvent,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

import { calculateBoundingPolygon } from '@/utils/getPolygon';

import { MapController } from './map-controller';

interface Location {
  lat: number;
  long: number;
  name: string;
}

interface MapViewerProps {
  locations: Location[];
  coord: LatLngTuple;
  setCoord: React.Dispatch<React.SetStateAction<LatLngTuple>>;
  selectedLocations: Location[];
}

const MapViewer = ({ locations, coord, setCoord, selectedLocations }: MapViewerProps) => {
  const map = useMapEvents({
    click: (event: LeafletMouseEvent) => {
      const clickedLatLng = event.latlng;
      setCoord([clickedLatLng.lat, clickedLatLng.lng]);
    },
  });

  const polygon = calculateBoundingPolygon(locations, 0.001);
  const polygonLatLngExpression = polygon.map(([lat, lng]) => [lat, lng] as LatLngTuple);

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
        {locations.map((location, index) => (
          <Marker key={index} position={[location.lat, location.long]}>
            <Popup>{location.name}</Popup>
          </Marker>
        ))}
        <MapController
          selectedMarkers={selectedLocations.map((location) => ({
            coord: [location.lat, location.long],
          }))}
        />
      </MapContainer>
    </div>
  );
};

export default MapViewer;
