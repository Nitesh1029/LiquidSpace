'use client';

import { LatLngTuple } from 'leaflet';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Hint } from '@/components/hint';

import { SearchDrawer } from './_components/sidebar';

const DynamicMap = dynamic(() => import('./_components/map-viewer'), {
  ssr: false,
});

const locations = [
  { lat: 28.6139, long: 77.209, name: 'New Delhi' },
  { lat: 28.7041, long: 77.1025, name: 'Noida' },
  { lat: 28.6139, long: 77.2345, name: 'Ghaziabad' },
  { lat: 28.6447, long: 77.2167, name: 'Faridabad' },
  // { lat: 28.7041, long: 77.1025, name: 'Gurgaon' },
];

interface Location {
  lat: number;
  long: number;
  name?: string;
}

export default function MyPage() {
  const [coord, setCoord] = useState<LatLngTuple>([28.6139, 77.209]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  console.log('selectedLocations', selectedLocations);

  const updateLocations = (newLocation: Location) => {
    const locationIndex = selectedLocations.findIndex(
      (loc) => loc.lat === newLocation.lat && loc.long === newLocation.long,
    );

    setSelectedLocations((prevSelectedLocations) =>
      locationIndex !== -1
        ? prevSelectedLocations.filter((_, index) => index !== locationIndex)
        : [...prevSelectedLocations, newLocation],
    );
  };

  return (
    <main className="relative">
      <DynamicMap
        locations={locations}
        coord={coord}
        setCoord={setCoord}
        selectedLocations={selectedLocations}
      />
      <Hint
        label={'See the location list here'}
        side="top"
        align="center"
        sideOffset={18}
      >
        <SearchDrawer
          selectedLocations={selectedLocations}
          locations={locations}
          handleUpdateLocations={updateLocations}
          coord={coord}
          setCoord={setCoord}
        />
      </Hint>
    </main>
  );
}
