'use client';

import { LatLngTuple } from 'leaflet';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Hint } from '@/components/hint';

import { SearchDrawer } from './_components/sidebar';

const DynamicMap = dynamic(() => import('./_components/map-viewer'), {
  ssr: false,
});

interface Location {
  id: number;
  name: string;
}

const locations = [
  { lat: 28.6139, long: 77.209, name: 'New Delhi' },
  { lat: 28.5355, long: 77.391, name: 'Noida' },
  { lat: 28.6692, long: 77.4538, name: 'Ghaziabad' },
  { lat: 28.4089, long: 77.3178, name: 'Faridabad' },
  { lat: 28.4595, long: 77.0266, name: 'Gurgaon' },
];

export default function MyPage() {
  const [coord, setCoord] = useState<LatLngTuple>([28.6139, 77.209]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);

  console.log(selectedLocations);

  const handleSelectedLocationsChange = (newSelectedLocations: typeof locations) => {
    setSelectedLocations((prevSelectedLocations: Location[]) => [
      ...prevSelectedLocations,
      ...newSelectedLocations,
    ]);
  };

  return (
    <main className="relative">
      <DynamicMap
        locations={locations}
        coord={coord}
        setCoord={setCoord}
        selectedLocations={selectedLocations}
      />
      <Hint label={'See the location list'} side="top" align="center" sideOffset={18}>
        <SearchDrawer
          locations={locations}
          coord={coord}
          setCoord={setCoord}
          selectedLocations={selectedLocations}
          onSelectedLocationsChange={handleSelectedLocationsChange}
        />
      </Hint>
    </main>
  );
}
