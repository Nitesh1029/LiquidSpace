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
  name: string;
}

interface SearchDrawerProps {
  locations: location[];
  coord: LatLngTuple;
  setCoord: React.Dispatch<React.SetStateAction<LatLngTuple>>;
  handleUpdateLocations: (newLocation: Location) => v;
}

export const SearchDrawer = ({ locations, coord, setCoord, handleUpdateLocations }: SearchDrawerProps) => {
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
                    location.lat === coord[0] && location.long === coord[1]
                      ? 'secondary'
                      : 'outline'
                  }
                  className={cn('w-full py-6')}
                  key={index}
                  onClick={() => setCoord([location.lat, location.long])}
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