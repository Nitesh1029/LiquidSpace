// import L from 'leaflet';
import { LatLngTuple } from 'leaflet';
import { FC, useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface location {
  lat: number;
  long: number;
  name?: string;
}

interface Review {
  coord: LatLngTuple;
  selectedLocations: location[];
}

const MapController: FC<{ selectedMarker: Review | null }> = ({ selectedMarker }) => {
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
      
    }

    if (selectedMarker && selectedMarker.coord) {
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
