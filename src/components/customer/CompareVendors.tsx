"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Star } from 'lucide-react';
import Image from 'next/image';

interface CompareVendorsProps {
  vendorIds: string[];
}

export function CompareVendors({ vendorIds }: CompareVendorsProps) {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['compare-vendors', vendorIds],
    queryFn: async () => {
      const { data } = await apiClient.get(`/customer/compare?ids=${vendorIds.join(',')}`);
      return data;
    },
    enabled: vendorIds.length > 0
  });

  if (isLoading) return <div className="h-64 animate-pulse bg-slate-50 rounded-xl" />;
  if (!vendors || vendors.length === 0) return <div>Select vendors to compare</div>;

  const features = [
    { label: 'Rating', key: 'rating', type: 'rating' },
    { label: 'Experience', key: 'experienceYears', suffix: ' years' },
    { label: 'Completed Events', key: 'totalBookings' },
    { label: 'Response Time', key: 'responseTime', suffix: ' mins' },
    { label: 'Starting Price', key: 'minPackagePrice', prefix: '₹' },
    { label: 'Packages', key: 'packagesCount' },
    { label: 'Verification', key: 'verificationStatus', type: 'badge' },
    { label: 'Cancellation', key: 'cancellationPolicy' },
    { label: 'Travel Charge', key: 'baseTravelCharge', prefix: '₹' },
  ];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Features</TableHead>
            {vendors.map((v: any) => (
              <TableHead key={v.id} className="min-w-[200px] text-center">
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border">
                    <Image src={v.logo || '/placeholder-vendor.png'} fill className="object-cover" alt={v.businessName} />
                  </div>
                  <span className="font-bold text-sm">{v.businessName}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.key}>
              <TableCell className="font-medium text-slate-500">{feature.label}</TableCell>
              {vendors.map((v: any) => (
                <TableCell key={v.id} className="text-center">
                  {feature.type === 'rating' ? (
                    <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-current" />
                      {v[feature.key]}
                    </div>
                  ) : feature.type === 'badge' ? (
                    v[feature.key] === 'APPROVED' ? (
                      <ShieldCheck className="h-5 w-5 text-blue-500 mx-auto" />
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )
                  ) : (
                    <span className="font-semibold">
                      {feature.prefix}{v[feature.key] || '0'}{feature.suffix}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
