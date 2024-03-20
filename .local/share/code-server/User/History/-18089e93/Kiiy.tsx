import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  // maxWidth: '400px',
  // maxHeight: '400px',
  borderRadius: '20px',
};

const center = {
  lat: -34.397,
  lng: 150.644,
};

const Map = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBx8U8HeiRkypJrRFa-At__mEUKSu1ZA-0',
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={{
        height: '30vh',
        width: '100%',
        borderRadius: '20px',
      }}
      center={center}
      zoom={10}
    >
      {/* Child components, like markers, info windows, etc. */}
    </GoogleMap>
  ) : (
    <></>
  );
};

export default Map;
