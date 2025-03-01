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
import {
  Navigation,
  Loader2,
  ExternalLink,
  MapPin,
  MapIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center bg-slate-100">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-blue-500">地図を読み込み中...</span>
    </div>
  ),
});

export default function Home() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(500);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [urlUpdated, setUrlUpdated] = useState(false);

  const debouncedDistance = useDebounce(distance, 1000);

  const getLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error);
          setIsGettingLocation(false);
        },
      );
    }
  };

  const { data, refetch, isLoading, isRefetching } =
    api.router.getWalkingRoute.useQuery(
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
      setUrlUpdated(true);
      const timer = setTimeout(() => setUrlUpdated(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      void refetch();
    }
  }, [latitude, longitude, refetch]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="border-0 bg-white shadow-lg">
        <CardHeader className="bg-blue-500 text-white">
          <CardTitle className="text-xl font-medium">散歩コース生成</CardTitle>
          <CardDescription className="text-blue-50">
            現在地から出発し、同じ場所に戻ってくる散歩コースをGoogle
            Mapで案内します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <Button
            onClick={getLocation}
            disabled={isGettingLocation}
            variant="outline"
            className="w-full border-blue-300 py-2 text-blue-600 hover:bg-blue-50"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                位置情報取得中...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" /> 現在地を取得
              </>
            )}
          </Button>
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="distance"
                className="text-sm font-medium text-blue-800"
              >
                距離（メートル）
              </label>
              {(isLoading || isRefetching) && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  <span className="text-xs">検索中...</span>
                </div>
              )}
            </div>
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
                onChange={(e) =>
                  setDistance(Number.parseInt(e.target.value, 10))
                }
                className="w-20 border-blue-200"
              />
            </div>
          </div>
          <div className="space-y-4">
            {latitude !== null && longitude !== null && (
              <Button
                onClick={() => refetch()}
                disabled={isRefetching}
                variant="outline"
                size="sm"
                className="ml-auto flex border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Navigation className="mr-1 h-4 w-4" />
                同じ距離で再検索
              </Button>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
              <div className="h-80 w-full">
                {latitude !== null && longitude !== null ? (
                  <Map
                    points={data?.originalPoints}
                    center={[latitude, longitude]}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
                    <MapIcon className="mb-4 h-12 w-12 text-blue-300" />
                    <h3 className="mb-2 text-lg font-medium text-blue-700">
                      散歩コースを生成するには
                    </h3>
                    <p className="text-sm text-blue-600">
                      「現在地を取得」ボタンをクリックしてください
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 bg-gray-50 p-4">
          {googleMapsUrl ? (
            <div className="w-full space-y-2">
              <Button
                asChild
                variant="default"
                className={`w-full py-5 text-white transition-all duration-500 ${
                  urlUpdated
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink
                    className={`mr-2 h-4 w-4 ${urlUpdated ? "animate-pulse" : ""}`}
                  />
                  {urlUpdated
                    ? "新しいルートが設定されました！"
                    : "Google Mapで散歩を始める"}
                </a>
              </Button>
              <p className="mt-2 text-center text-xs text-gray-500">
                ※Google
                Mapの仕様上、目的地は最大10件までのため、表示されるルートが実際のプレビューと異なる場合があります
              </p>
            </div>
          ) : (
            <div className="w-full py-3 text-center text-sm text-gray-500">
              現在地を取得すると、散歩コースのプレビューとGoogle
              Mapリンクが表示されます
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
