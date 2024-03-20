// geolocation.tsx

import { useEffect, useState } from 'react';

type LocationData = {
  latitude: number | null;
  longitude: number | null;
  pincode: string | null;
  city: string | null;
  country: string | null;
};

export function GeolocationComponent() {
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    pincode: null,
    city: null,
    country: null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  const showPosition = (position: { coords: { latitude: any; longitude: any } }) => {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;

    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=YOUR_API_KEY`,
    )
      .then((response) => response.json())
      .then((data) => {
        const pincode = data.results[0].address_components.find(
          (component: { types: string | string[] }) =>
            component.types.includes('postal_code'),
        )?.long_name;
        const city = data.results[0].address_components.find(
          (component: { types: string | string[] }) =>
            component.types.includes('locality'),
        )?.long_name;
        const country = data.results[0].address_components.find(
          (component: { types: string | string[] }) =>
            component.types.includes('country'),
        )?.long_name;

        setLocationData({
          latitude: lat,
          longitude: long,
          pincode: pincode || 'N/A',
          city: city || 'N/A',
          country: country || 'N/A',
        });
      });
  };

  const showError = (error: {
    code: any;
    PERMISSION_DENIED: any;
    POSITION_UNAVAILABLE: any;
    TIMEOUT: any;
  }) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        alert('User denied the request for geolocation');
        break;

      case error.POSITION_UNAVAILABLE:
        alert('Location information is unavailable');
        break;

      case error.TIMEOUT:
        alert('The request to get user location timed out');
        break;
    }
    console.log(error);
  };

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return locationData;
}
