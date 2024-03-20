'use client';

import { MoonIcon, SunIcon, ValueNoneIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import Link from 'next/link';
import { SetStateAction, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useGeolocated } from '@/lib/GeoLocation';
import { cn } from '@/lib/utils';

function Item({ name, value, description, tag, image }: any) {
  const quantity = useMemo(() => {
    return Math.ceil((value || 0) / 8000);
  }, [value]);

  return (
    <Collapsible className=" p-2 border-2 rounded-md border-muted w-full">
      <CollapsibleTrigger className="no-underline hover:no-underline w-full ">
        <div className="flex items-center text-left justify-between w-full">
          <div className="flex space-x-2 w-full">
            {image && (
              <div className="flex-shrink-0">
                <Image className="h-10 w-10 rounded-full" src={image} alt="" />
              </div>
            )}
            <div className="flex flex-col w-full">
              <div className="flex">
                <div className="text-sm font-medium text-primary">{name}</div>
                <Badge className="ml-auto md:ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary-foreground text-gray-500">
                  {tag}
                </Badge>
              </div>
              <div className="flex">
                <p className="text-sm text-muted-foreground mr-2">{description}</p>
                <div className="ml-auto self-end inline-flex text-xl md:text-2xl font-medium text-primary">
                  {quantity ? `${quantity}\u00A0cases` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2 flex items-center text-left justify-between text-xs font-medium text-primary">
          MRP 5 /pc &bull; 30 pcs in jar &bull; 24 jars in case
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InputCurrency({ value, onChange }: any) {
  useEffect(() => {
    onChange?.(value);
  }, [value, onChange]);

  const handleChange = (event: any) => {
    const { value } = event.target;
    const currency = value.replace(/[^0-9.]/g, '');

    onChange?.(currency);
  };
  return (
    <Input
      id="number"
      className={cn(
        'border-0 border-b-2 border-muted focus:border-primary text-2xl tracking-tight',
      )}
      value={Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(Math.round(parseFloat(value) || 0))}
      onChange={handleChange}
      placeholder="..."
    />
  );
}

function RadioGroupOrder({ onChange }: any) {
  const handleChange = (event: any) => {
    const { value } = event.target;
    onChange?.(value);
  };
  return (
    <RadioGroup
      defaultValue="card"
      className="grid grid-cols-3 gap-4"
      onClick={handleChange}
    >
      <div>
        <RadioGroupItem value="no-order" id="no-order" className="peer sr-only" />
        <Label
          htmlFor="no-order"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
        >
          <ValueNoneIcon className="mb-3 h-6 w-6" />
          None
        </Label>
      </div>
      <div>
        <RadioGroupItem
          value="passive-order"
          id="passive-order"
          className="peer sr-only"
        />
        <Label
          htmlFor="passive-order"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
        >
          <MoonIcon className="mb-3 h-6 w-6" />
          Passive
        </Label>
      </div>
      <div>
        <RadioGroupItem value="active-order" id="active-order" className="peer sr-only" />
        <Label
          htmlFor="active-order"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
        >
          <SunIcon className="mb-3 h-6 w-6" />
          Active
        </Label>
      </div>
    </RadioGroup>
  );
}

function OrderValuePlanning({ onChange }: any) {
  const maxValue = 200000;
  const [orderValue, setOrderValue] = useState(0);
  const slabBasedMessage = useMemo(() => {
    if (orderValue > 200000) {
      return 'You are in the top 1% of all businesses';
    } else if (orderValue > 100000) {
      return 'You are in the top 10% of all businesses';
    } else if (orderValue > 50000) {
      return 'You are in the top 20% of all businesses';
    } else if (orderValue > 30000) {
      return 'You are in the top 50% of all businesses';
    } else {
      return 'You are in the bottom 50% of all businesses';
    }
  }, [orderValue]);

  useEffect(() => {
    onChange?.({ value: orderValue });
  }, [orderValue, onChange]);

  return (
    <Card className=" mb-4">
      <CardHeader>
        <CardTitle>Order Value</CardTitle>
        <CardDescription>Select your strategy for this month</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <RadioGroupOrder
          onChange={(value: string) => {
            if (value === 'no-order') {
              setOrderValue(0);
            } else if (value === 'passive-order') {
              setOrderValue(35000);
            } else if (value === 'active-order') {
              setOrderValue(100000);
            }
          }}
        />
        <div className="grid gap-2">
          {/* This could be a monthly target or the next bill target */}
          <Label htmlFor="name">Billing Value</Label>
          <InputCurrency
            value={orderValue}
            onChange={(value: SetStateAction<number>) => setOrderValue(value)}
          />
          <Slider
            defaultValue={[(orderValue * 100) / maxValue]}
            max={100}
            step={1}
            onValueChange={(value: any) => {
              setOrderValue((value * maxValue) / 100);
            }}
            onInput={(event: any) => {
              const { value } = event.currentTarget;
              setOrderValue((parseInt(value) * maxValue) / 100);
            }}
            onChange={(event: any) => {
              const { value } = event.currentTarget;
              setOrderValue((parseInt(value) * maxValue) / 100);
            }}
            className={cn('w-full')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="number">{slabBasedMessage}</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button disabled={!orderValue} asChild className="w-full">
          <Link replace={false} href="#scroll-2">
            Continue
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// write a component that displays an item, the item has a name, a numeric value, a quantity percentage and a description along with optional image

export default function Page() {
  const { coords, isGeolocationAvailable, positionError } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: true,
      },
      userDecisionTimeout: 5000,
      watchLocationPermissionChange: true,
    });

  const [geolocationNotAvailable, setGeolocationNotAvailable] = useState(false);

  // console.log('coords, isGeolocationAvailable, isGeolocationEnabled, positionError');
  // console.log(coords, isGeolocationAvailable, isGeolocationEnabled, positionError);

  const [orderValue, setOrderValue] = useState(null);

  useEffect(() => {
    if (!isGeolocationAvailable) {
      setGeolocationNotAvailable(true);
    }
  }, [isGeolocationAvailable]);

  // if (geolocationNotAvailable) {
  //   return <div>Your browser does not support Geolocation</div>;
  // }
  // if (!isGeolocationEnabled || positionError) {
  //   return <div>Geolocation is not enabled</div>;
  // }

  // if (!coords) {
  //   return <div>Getting your location...</div>;
  // }

  return (
    <ScrollArea className={cn('flex items-center justify-center [&>div]:w-full p-4')}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Planning</h2>
          <p className="text-sm text-muted-foreground">
            Our Generative AI suggestions help you plan for your business and sales
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <OrderValuePlanning onChange={({ value }: any) => setOrderValue(value)} />
      <Card>
        <CardHeader>
          <CardTitle>Product Planning</CardTitle>
          <CardDescription>
            These are the products we recommend you to stock up on
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Item
            name={'Rockerz Caramel Crunch'}
            tag={'New'}
            value={orderValue}
            description={
              'The most popular product in the market. It is a must have for every store'
            }
          />
          <Item
            name={'Cream Wafer Value Pack'}
            value={orderValue}
            tag={'Popular'}
            description={
              'Enjoy the goodness of cream and wafer in this value pack. At Rs 2/- per piece, it is a steal'
            }
          />
          <Item
            name={'Fun Chocolate Bar'}
            value={orderValue}
            tag={'Seasonal'}
            description={
              'Everyones favourite chocolate bar, now in three varities - Milk, Dark and White'
            }
          />
          {orderValue ? (
            <Item
              name={'Remaining Assorted ...'}
              value={orderValue}
              description={
                'Choose from our wide range of long cream wafers, rolled wafers, and chocolate coated wafers'
              }
            />
          ) : null}
          <div id="scroll-2" />
        </CardContent>
        {/* <CardFooter>
          <Button className="w-full">Continue</Button>
        </CardFooter> */}
      </Card>
    </ScrollArea>
  );
}
