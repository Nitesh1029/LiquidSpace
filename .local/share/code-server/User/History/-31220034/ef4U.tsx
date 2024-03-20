import L from 'leaflet';
import { LatLngTuple } from 'leaflet';
import { FC, useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface Review {
  coord: LatLngTuple;
}

interface MapControllerProps {
  selectedMarkers: Review[];
  map: L.Map;
}

const MapController: FC<MapControllerProps> = ({ selectedMarkers, map }) => {
  const map = useMap();
  const flyToDuration = 1.5;

  const calculateDistance = (coord1: LatLngTuple, coord2: LatLngTuple) => {
    const R = 6371;
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance;
  };

  const flyToSelectedMarkers = () => {
    if (selectedMarkers.length >= 2) {
      const coords = selectedMarkers.map((marker) => marker.coord);

      const bounds = L.latLngBounds(coords);
      const center = bounds.getCenter();
      const distance = calculateDistance(coords[0], coords[1]);

      map.flyTo(center, calculateZoomLevel(distance), {
        animate: true,
        duration: flyToDuration,
      });
    }
  };

  const calculateZoomLevel = (distance: number) => {
    const zoomFactor = 0.1;
    const zoomLevel = Math.max(1, 18 - Math.log2(distance) * zoomFactor);

    return zoomLevel;
  };

  useEffect(() => {
    if (selectedMarkers.length >= 2) {
      flyToSelectedMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkers]);

  return null;
};

export { MapController };
