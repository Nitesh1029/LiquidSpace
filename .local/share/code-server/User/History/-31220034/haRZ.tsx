// import L from 'leaflet';
import { LatLngTuple } from 'leaflet';
import { FC, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

interface Location {
  lat: number;
  long: number;
  name?: string;
}

interface Review {
  coord: LatLngTuple;
  selectedLocations?: Location[] | null;
}

const MapController: FC<{ selectedMarker: Review | null }> = ({ selectedMarker }) => {
  const [center, setCenter] = useState([59.914, 10.734]);
  const map = useMap();
  const flyToDuration = 1.5;

  const flyTo = (location: LatLngTuple) => {
    map.flyTo(location, 15, {
      animate: true,
      duration: flyToDuration,
    });
  };

  const flyToCenter = () => {
    map.flyTo([59.914, 10.734], 13, {
      animate: true,
      duration: flyToDuration,
    });
  };

  useEffect(() => {
    const calculateCenter = () => {
      if (
        !selectedMarker?.selectedLocations ||
        selectedMarker.selectedLocations.length === 0
      ) {
        return [0, 0] as LatLngTuple;
      }
      const totalLat = selectedMarker.selectedLocations.reduce(
        (sum, location) => sum + location.lat,
        0,
      );
      const totalLong = selectedMarker.selectedLocations.reduce(
        (sum, location) => sum + location.long,
        0,
      );
      const averageLat = totalLat / selectedMarker.selectedLocations.length;
      const averageLong = totalLong / selectedMarker.selectedLocations.length;
      return [averageLat, averageLong] as LatLngTuple;
    };
    setCenter(() => calculateCenter());
    if (selectedMarker && selectedMarker.coord && map) {
      flyTo(selectedMarker.coord);
    } else {
      flyToCenter();
    }
  }, [selectedMarker, map]);

  return null;
};

export { MapController };
//   const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

//   useEffect(() => {
//     map.eachLayer(async (layer) => {
//       if (layer instanceof L.Marker) {
//         const markerPosition = layer.getLatLng();

//         if (
//           selectedMarker &&
//           markerPosition.lat === selectedMarker.coord[0] &&
//           markerPosition.lng === selectedMarker.coord[1]
//         ) {
//           await sleep(flyToDuration * 1000 + 100);
//           layer.bounce();
//         } else {
//           layer.stopBouncing();
//         }
//       }
//     });
//   }, [selectedMarker, map]);
