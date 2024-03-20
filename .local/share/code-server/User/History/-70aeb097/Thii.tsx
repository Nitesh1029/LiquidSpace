/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { number, z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    message: "Company's name must seems incomplete.",
  }),
  contact: z.string().refine((value) => /^[6-9]\d{9}$/.test(value), {
    message: 'Enter a valid phone number',
  }),
  email: z.string().email({ message: 'Invalid email address' }),
});

export default function Page() {
  const [locationData, setLocationData] = useState({
    latitude: null,
    longitude: null,
    pincode: null,
    city: null,
    country: null,
    area: null,
  });
  const { toast } = useToast();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      contact: '',
      company: '',
    },
  });

<<<<<<< HEAD
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (location !== '') {
      getLocation(latitude, longitude);

      const formData: FormData = { ...data, area: location, categories: ['string'] };

      const rawResponse = await fetch(
        'https://api-staging.storewise.in/partner/interest',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        },
      );
      const content = await rawResponse.json();

      toast({
        title: content.message,
        description: (
          <pre className="p-4 bg-gray-300">
            {Object.keys(formData).map((el, index) => (
              <ul key={index}>
                <li>
                  {/* @ts-ignore */}
                  {el} : {formData[el]}
                </li>
              </ul>
            ))}
          </pre>
        ),
      });
=======
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError);
>>>>>>> 7c47002 (changes)
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  const showPosition = (position: { coords: { latitude: any; longitude: any } }) => {
    let lat = position.coords.latitude;
    let long = position.coords.longitude;

    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyA11tI1FaN4trorxaSq7Ab6O6Sk4Lxl3gA`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results[0]) {
          let addressComponents = data.results[0].address_components;

          let pincode = addressComponents.find(
            (component: { types: string | string[] }) =>
              component.types.includes('postal_code'),
          )?.long_name;

          let city = addressComponents.find((component: { types: string | string[] }) =>
            component.types.includes('locality'),
          )?.long_name;

          let country = addressComponents.find(
            (component: { types: string | string[] }) =>
              component.types.includes('country'),
          )?.long_name;

          // let area = addressComponents.find((component: { types: string | string[] }) =>
          //   component.types.includes('sublocality'),
          // )?.long_name;

          let street = addressComponents.find((component: { types: string | string[] }) =>
            component.types.includes('route'),
          )?.long_name;

          let locality = addressComponents.find(
            (component: { types: string | string[] }) =>
              component.types.includes('neighborhood'),
          )?.long_name;

          let area = [street, locality, city, country, pincode]
            .filter(Boolean)
            .join(', ');

          setLocationData((prevData: any) => ({
            ...prevData,
            latitude: lat,
            longitude: long,
            pincode: pincode || 'N/A',
            city: city || 'N/A',
            country: country || 'N/A',
            area: area || 'N/A',
          }));
        } else {
          console.error('No valid result found in geocoding data');
        }
      })
      .catch((error) => {
        console.error('Error fetching geocoding data:', error);
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
  }, []);

  async function onSubmit(data: FormData) {
    // console.log('Submit button clicked', data);
    const formData: FormData = {
      ...data,
      email: data.email,
      company: data.company,
      contact: data.contact,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      area: locationData.area || 'N/A',
      categories: ['string'] || 'N/A',
    };
    const rawResponse = await fetch('https://api-staging.storewise.in/partner/interest', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const content = await rawResponse.json();
    // console.log('Response:', rawResponse.status, content);
    if (!rawResponse.ok) {
      console.error('Error:', rawResponse.status, content);
    }

    toast({
      title: content.message,
      description: (
        <pre className="p-4 bg-green-300">
          {Object.keys(formData).map((el, index) => (
            <ul key={index}>
              <li>
                {el} : {formData[el]}
              </li>
            </ul>
          ))}
        </pre>
      ),
    });
  }

  return (
    <div>
      <Card className="flex items-center justify-center text-center">
        <CardHeader>
          <CardTitle>User Location Information</CardTitle>
          <CardDescription>
            Displaying location details based on users geolocation
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="flex items-center justify-center min-h-[70vh] py-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-[60%] flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address: {locationData.area}</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </Card>
      <Toaster />
    </div>
  );
}
