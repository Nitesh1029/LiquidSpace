/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
type FormData = {
  email: string | null;
  company: string | null;
  contact: number | null;
  categories: string[] | null;
  latitude: number | null;
  longitude: number | null;
  pincode: string | null;
  city: string | null;
  country: string | null;
  area: string | null;
};

const FormSchema = z.object({
  company: z.string().min(2, {
    message: "Company's name seems incomplete.",
  }),
  pincode: z.string().refine((value) => /^\d{6}$/.test(value), {
    message: 'Pincode must be a 6 digit number',
  }),
  contact: z.string().refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: 'Enter a valid 10 digit phone number',
  }),
  email: z.string().email({ message: 'Invalid email address' }),
});

export default function Page() {
  const [locationData, setLocationData] = useState<any>({
    latitude: null,
    longitude: null,
    pincode: null,
    city: null,
    country: null,
    area: null,
  });
  const { toast } = useToast();
  const [error, setError] = useState<any>({});
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      contact: '',
      company: '',
      pincode: '',
    },
  });

  const fetchLocationData = (
    lat: number | null,
    long: number | null,
    pincode: string | null,
    city: string | null,
    country: string | null,
    area: string | null,
  ) => {
    setLocationData((prevData: any) => ({
      ...prevData,
      latitude: lat,
      longitude: long,
      pincode: pincode || 'N/A',
      city: city || 'N/A',
      country: country || 'N/A',
      area: area || 'N/A',
    }));
  };

  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setShowDialog(true);
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => getPositionFromCoords(position),
        (error) => {
          showError(error);
        },
      );
    }
  };

  const getPositionFromCoords = async (position: {
    coords: { latitude: any; longitude: any };
  }) => {
    let lat = position.coords.latitude;
    let long = position.coords.longitude;

    const handleGeocodingData = (data: any) => {
      if (data.results && data.results[0]) {
        let addressComponents = data.results[0].address_components;

        let pincode = addressComponents.find((component: { types: string | string[] }) =>
          component.types.includes('postal_code'),
        )?.long_name;

        let city = addressComponents.find((component: { types: string | string[] }) =>
          component.types.includes('locality'),
        )?.long_name;

        let country = addressComponents.find((component: { types: string | string[] }) =>
          component.types.includes('country'),
        )?.long_name;

        let street = addressComponents.find((component: { types: string | string[] }) =>
          component.types.includes('route'),
        )?.long_name;

        let locality = addressComponents.find((component: { types: string | string[] }) =>
          component.types.includes('neighborhood'),
        )?.long_name;

        let area = [street, locality, city, country].filter(Boolean).join(', ');

        fetchLocationData(lat, long, pincode, city, country, area);
        let setValue = form.setValue as (name: keyof FormData, value: any) => void;

        setValue('latitude', lat);
        setValue('longitude', long);
        setValue('pincode', pincode);
        setValue('city', city);
        setValue('country', country);
        setValue('area', area);
      }
    };

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyA11tI1FaN4trorxaSq7Ab6O6Sk4Lxl3gA`,
    );
    const data = await response.json();
    handleGeocodingData(data);
  };

  const fetchLocationDataByPincode = async (pincode: string) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${pincode}|country:IN&key=AIzaSyA11tI1FaN4trorxaSq7Ab6O6Sk4Lxl3gA`,
    );

    const data = await response.json();
    if (data.results && data.results[0]) {
      let addressComponents = data.results[0].address_components;

      let city = addressComponents.find((component: { types: string | string[] }) =>
        component.types.includes('locality'),
      )?.long_name;

      let country = addressComponents.find((component: { types: string | string[] }) =>
        component.types.includes('country'),
      )?.long_name;
      let area = [city, country].filter(Boolean).join(', ');

      fetchLocationData(null, null, pincode, null, null, area);
      return area;
    }
    return '';
  };

  const showError = (error: {
    code: any;
    PERMISSION_DENIED: any;
    POSITION_UNAVAILABLE: any;
    TIMEOUT: any;
  }) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        break;

      case error.POSITION_UNAVAILABLE:
        alert('Location information is unavailable');
        break;

      case error.TIMEOUT:
        alert('The request to get user location timed out');
        break;
    }
  };

  async function onSubmit(data: FormData) {
    try {
      let area = locationData.area;
      if (locationData.latitude && locationData.longitude) {
        fetchLocationData(
          locationData.latitude,
          locationData.longitude,
          locationData.pincode,
          locationData.city,
          locationData.country,
          locationData.area,
        );
      }
      const formData: FormData = {
        ...data,
        email: data.email,
        company: data.company,
        contact: data.contact,
        area: area || 'N/A',
        categories: ['string'] || 'N/A',
      };
      try {
        FormSchema.parse(formData);
      } catch (error: any) {
        console.log(error.formErrors);
        setError(error.formErrors?.fieldErrors);
        return;
      }
      const rawResponse = await fetch(
        'https://api-staging.storewise.in/partner/interest',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      );

      const content = await rawResponse.json();
      const keysToDisplay = ['email', 'company', 'area', 'contact'];
      toast({
        title: content.message,
        description: (
          <pre className="p-4 bg-green-300">
            {keysToDisplay.map((el, index) => (
              <ul key={index}>
                <li>
                  {el} : {formData[el]}
                </li>
              </ul>
            ))}
          </pre>
        ),
      });
    } catch (error) {
      toast({
        title: 'There was a small hiccup in submitting the form',
        description: (
          <pre className="p-4 bg-red-300">
            <p>
              We do not know what might have gone wrong,
              <br />
              but we are working on fixing it.
              <br />
              Please try to submit the form again after some time
            </p>
          </pre>
        ),
      });
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backgroundImage: "url('/background_collage.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {showDialog && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-opacity-50 z-1000">
          <Card className="text-center w-max m-auto">
            <CardHeader>
              <CardTitle>Location Access</CardTitle>
              <CardDescription>
                Sharing your location will allow us to help you fill this form
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center p-4">
              <Button
                onClick={() => {
                  getLocation();
                  setShowDialog(false);
                }}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      <Card className="items-center text-left  flex flex-col gap-4 bg-gray-100 p-4 w-max shadow shadow-md shadow-gray-300">
        <CardHeader>
          <CardTitle>Distributor Interest Form</CardTitle>
          <CardDescription>Help us reach out and partner with you</CardDescription>
        </CardHeader>
        <Separator />
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-[60%]">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Email Address"
                    className="bg-white w-full"
                    {...field}
                  />
                </FormControl>
                {error.email && <FormMessage>{error.email}</FormMessage>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="w-[60%]">
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Company's name"
                    className="bg-white w-full"
                    {...field}
                  />
                </FormControl>
                {error.company && <FormMessage>{error.company}</FormMessage>}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }: any) => (
              <FormItem className="w-[60%]">
                <FormLabel>PinCode</FormLabel>
                <FormControl>
                  <Input
                    onInput={(e) => {
                      if (e.currentTarget.value.length === 6) {
                        fetchLocationDataByPincode(e.currentTarget.value);
                      }
                    }}
                    className="bg-white w-full"
                    placeholder="Enter your Pin code"
                    {...field}
                  />
                </FormControl>
                {error.pincode && <FormMessage>{error.pincode}</FormMessage>}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem className="w-[60%]">
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <Input
                    className="bg-white w-full"
                    placeholder="Contact Number"
                    {...field}
                  />
                </FormControl>
                {error.contact && <FormMessage>{error.contact}</FormMessage>}
              </FormItem>
            )}
          />
          <Button
            size={'lg'}
            type="submit"
            className="w-[60%]"
            onClick={async (e) => {
              e.preventDefault();
              setError({});
              const formData = { ...locationData, ...form.getValues() };
              await onSubmit(formData);
            }}
          >
            Submit
          </Button>
        </Form>
      </Card>
      <Toaster />
    </div>
  );
}
