import { LatLngTuple } from 'leaflet';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface Location {
  lat: number;
  long: number;
  name: string;
}

interface SearchDrawerProps {
  locations: Location[];
  coord: LatLngTuple;
  setCoord: React.Dispatch<React.SetStateAction<LatLngTuple>>;
  selectedLocations: Location[];
  onSelectedLocationsChange: (newSelectedLocations: Location[]) => void;
}

export const SearchDrawer = ({ locations, coord, setCoord }: SearchDrawerProps) => {
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  console.log(selectedLocations);

  const toggleLocation = (location: Location) => {
    setSelectedLocations((prev) => {
      const isSelected = prev.some(
        (selectedLocation) =>
          selectedLocation.lat === location.lat &&
          selectedLocation.long === location.long,
      );

      return isSelected
        ? prev.filter(
            (selectedLocation) =>
              selectedLocation.lat !== location.lat ||
              selectedLocation.long !== location.long,
          )
        : [...prev, location];
    });
  };

  const handleApplyClick = () => {
    if (selectedLocations.length > 0) {
      const selectedCoords = selectedLocations.map((location) => [
        location.lat,
        location.long,
      ]);
      setCoord(selectedCoords[0] as LatLngTuple);
    }
    setSelectedLocations([]);
  };

  return (
    <div className="absolute z-10 bottom-4 left-1/2 transform -translate-x-1/2">
      <Drawer>
        <DrawerTrigger className="bg-black text-whcommitedite px-6 rounded-sm py-2 w-[300px]">
          Search
        </DrawerTrigger>
        <div className="mx-auto w-full max-w-sm">
          <DrawerContent className="p-4">
            <DrawerHeader>
              <DrawerTitle>Locations</DrawerTitle>
              <DrawerDescription>
                Tap on the location to see it on the map
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-2 p-4 gap-2 bg-gray-50 rounded-sm">
              {locations.map((location, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location)}
                    onChange={() => toggleLocation(location)}
                    className="mr-3"
                  />
                  <Button
                    variant={
                      selectedLocations.includes(location) ? 'secondary' : 'outline'
                    }
                    className={cn('w-full py-6')}
                    onClick={() => toggleLocation(location)}
                  >
                    {location.name}
                  </Button>
                </div>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose>
                <Button className="w-full" variant="outline" onClick={handleApplyClick}>
                  Apply
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </div>
      </Drawer>
    </div>
  );
};
