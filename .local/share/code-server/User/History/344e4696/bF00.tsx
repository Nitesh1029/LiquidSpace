import { LatLngTuple } from 'leaflet';
import React from 'react';

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

interface location {
  lat: number;
  long: number;
  name?: string;
}

interface SearchDrawerProps {
  locations: location[];
  selectedLocations: location[];
  coord: LatLngTuple;
  setCoord: React.Dispatch<React.SetStateAction<LatLngTuple>>;
  handleUpdateLocations: (newLocation: location) => void;
}

export const SearchDrawer = ({
  locations,
  selectedLocations,
  coord,
  setCoord,
  handleUpdateLocations,
}: SearchDrawerProps) => {
  console.log(locations);
  return (
    <div className="absolute z-10 bottom-4 left-1/2 transform -translate-x-1/2">
      <Drawer>
        <DrawerTrigger className="bg-black text-white px-6 rounded-sm py-2  w-[300px]">
          Search
        </DrawerTrigger>
        <div className="mx-auto w-full max-w-sm ">
          <DrawerContent className="p-4">
            <DrawerHeader>
              <DrawerTitle>Locations</DrawerTitle>
              <DrawerDescription>
                Tap on the location to see it on the map
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-2 p-4  gap-2 bg-gray-50 rounded-sm">
              {locations.map((location, index) => (
                <Button
                  variant={
                    selectedLocations.some(
                      (selectedLoc) =>
                        selectedLoc.lat === location.lat &&
                        selectedLoc.long === location.long,
                    )
                      ? 'default'
                      : 'outline'
                  }
                  className={cn('w-full py-6')}
                  key={index}
                  // onClick={() => setCoord([location.lat, location.long])}
                  onClick={() =>
                    handleUpdateLocations({ lat: location.lat, long: location.long })
                  }
                >
                  {location.name}
                </Button>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose>
                <Button className="w-full" variant={'outline'}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </div>
      </Drawer>
    </div>
  );
};
