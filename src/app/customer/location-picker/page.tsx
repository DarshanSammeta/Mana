'use client';

import React from 'react';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '@/store/checkoutStore';

export default function LocationPickerPage() {
  const router = useRouter();
  const { setLocation } = useCheckoutStore();

  const handleLocationSelect = (loc: { address: string; lat: number; lng: number }) => {
    // Save to store or session
    setLocation({
      address: loc.address,
      coordinates: { lat: loc.lat, lng: loc.lng },
      city: '', // Extract from address if needed
      state: '',
      pincode: '',
      landmark: ''
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Select Your Event Location</CardTitle>
          <p className="text-muted-foreground">This helps us find the best vendors near you.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <LocationPicker onLocationSelect={handleLocationSelect} />
          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={() => router.back()} className="px-10">
              Confirm Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
