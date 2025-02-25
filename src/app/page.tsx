"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

export default function Home() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(1000);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  const { data, refetch } = api.router.getWalkingRoute.useQuery(
    { latitude: latitude ?? 0, longitude: longitude ?? 0, distance },
    {
      enabled: latitude !== null && longitude !== null,
    },
  );
  useEffect(() => {
    if (data?.googleMapsUrl) {
      setGoogleMapsUrl(data.googleMapsUrl);
    }
  }, [data]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <input
        type="number"
        placeholder="Distance (m)"
        value={distance}
        onChange={(e) => setDistance(parseInt(e.target.value, 10))}
        className="border p-2"
      />
      <button
        onClick={() => refetch()}
        disabled={latitude === null || longitude === null}
        className="rounded bg-blue-500 p-2 text-white"
      >
        Get Walking Route
      </button>
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  );
}
