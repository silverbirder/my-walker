"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation, Loader2 } from "lucide-react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(1000);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  const debouncedDistance = useDebounce(distance, 500);

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

  const { data, refetch, isLoading } = api.router.getWalkingRoute.useQuery(
    {
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      distance: debouncedDistance,
    },
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
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Walking Route Generator</CardTitle>
        <CardDescription>
          Generate a walking route based on your current location and desired
          distance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            {latitude && longitude
              ? `Current Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              : "Fetching location..."}
          </span>
        </div>
        <div className="space-y-2">
          <label htmlFor="distance" className="text-sm font-medium">
            Distance (meters)
          </label>
          <div className="flex items-center space-x-4">
            <Slider
              id="distance"
              min={100}
              max={5000}
              step={100}
              value={[distance]}
              onValueChange={(value) => setDistance(value[0] ?? 0)}
              className="flex-grow"
            />
            <Input
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number.parseInt(e.target.value, 10))}
              className="w-20"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button
          onClick={() => refetch()}
          disabled={latitude === null || longitude === null || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Route...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Get Walking Route
            </>
          )}
        </Button>
        {googleMapsUrl && (
          <Button asChild variant="outline" className="w-full">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
