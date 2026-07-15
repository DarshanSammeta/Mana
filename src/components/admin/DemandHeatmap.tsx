"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import L from 'leaflet';

interface HeatmapLayerProps {
    points: [number, number, number][]; // [lat, lng, intensity]
}

const HeatmapLayer = ({ points }: HeatmapLayerProps) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !points.length) return;

        const heatLayer = (L as any).heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
};

export const DemandHeatmap: React.FC = () => {
    // Fix for Leaflet icons in Next.js
    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    const [data, setData] = useState<[number, number, number][]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                const res = await fetch('/api/admin/dashboard/heatmaps?type=bookings');
                const result = await res.json();
                // Map API response to [lat, lng, intensity]
                const points = result.map((p: any) => [p.lat, p.lng, p.weight || 0.5]);
                setData(points);
            } catch (err) {
                console.error("Failed to fetch heatmap data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmapData();
    }, []);

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 relative">
            {loading && (
                <div className="absolute inset-0 bg-white/50 z-[1000] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}
            <MapContainer
                center={[12.9716, 77.5946]} // Default to Bangalore or dynamic
                zoom={11}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <HeatmapLayer points={data} />
            </MapContainer>
        </div>
    );
};
