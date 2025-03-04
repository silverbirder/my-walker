"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  Loader2,
  ExternalLink,
  MapPin,
  MapIcon,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { DialogOverlay } from "@/components/ui/dialog";

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

  const debouncedDistance = useDebounce(distance, 500);

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

  const incrementDistance = (amount: number) => {
    setDistance((prev) => {
      const newValue = Math.round((prev + amount) / 100) * 100;
      return Math.min(Math.max(newValue, 100), 3000);
    });
  };

  const { data, refetch, isLoading, isRefetching, isFetching } =
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
  const isSearching = useMemo(
    () => isLoading || isRefetching || isFetching,
    [isLoading, isRefetching, isFetching],
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
    <main className="flex min-h-screen flex-col bg-gray-100">
      <div className="flex-grow">
        <Card className="mx-auto w-full max-w-2xl rounded-none shadow-none">
          <CardHeader className="bg-blue-500 text-white">
            <CardTitle className="text-2xl">散歩コース生成</CardTitle>
            <CardDescription className="text-blue-100">
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
                <label className="text-sm font-medium text-blue-800">
                  距離（メートル）
                </label>
                {isSearching && (
                  <div className="flex items-center text-blue-600">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    <span className="text-xs">検索中...</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-blue-600">
                  <span>100m</span>
                  <span>3000m</span>
                </div>
                <Progress value={(distance - 100) / 29} className="h-2" />
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-700">
                    {distance}m
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => incrementDistance(-100)}
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-100"
                  disabled={distance <= 100}
                >
                  <Minus className="h-4 w-4" />
                  <span className="ml-1">100</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => incrementDistance(100)}
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-100"
                  disabled={distance >= 3000}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">100</span>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {latitude !== null && longitude !== null && (
                <Button
                  onClick={() => refetch()}
                  disabled={isSearching}
                  variant="outline"
                  size="sm"
                  className="ml-auto flex border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Navigation className="mr-1 h-4 w-4" />
                  同じ距離で再検索
                </Button>
              )}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="h-80 w-full">
                  {latitude !== null && longitude !== null ? (
                    <Map
                      points={data?.originalPoints}
                      center={[latitude, longitude]}
                      isSearching={isSearching}
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
          <CardFooter className="flex flex-col space-y-4 bg-gray-50">
            {googleMapsUrl ? (
              <div className="w-full space-y-2">
                <div className="flex w-full items-center">
                  <Button
                    asChild
                    variant="default"
                    className={`flex-1 py-5 text-white transition-all duration-500 ${
                      isSearching
                        ? "cursor-not-allowed bg-gray-400"
                        : urlUpdated
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    disabled={isSearching}
                  >
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isSearching ? "pointer-events-none" : ""}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {isSearching
                        ? "ルートを検索中..."
                        : urlUpdated
                          ? "新しいルートが設定されました！"
                          : "Google Mapで散歩を始める"}
                    </a>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Info className="h-5 w-5" />
                        <span className="sr-only">ナビゲーションのヒント</span>
                      </Button>
                    </DialogTrigger>
                    <DialogOverlay className="z-[1000]" />
                    <DialogContent className="z-[1001] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Google Mapの便利な使い方</DialogTitle>
                        <DialogDescription>
                          散歩をより快適にするためのヒントです
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">経由地に到着したら</h4>
                            <p className="text-sm text-muted-foreground">
                              「次の経由地へ」をタップしましょう。タップしないと次のナビが始まりません。
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
                            <Minus className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">経由地の削除</h4>
                            <p className="text-sm text-muted-foreground">
                              画面下部のナビメニューを上にスワイプし、「次の経由地を削除」を選択すると、経由地をスキップできます。
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
                            <Navigation className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">音声ガイダンス設定</h4>
                            <p className="text-sm text-muted-foreground">
                              画面下部のナビメニューを上にスワイプし、設定から「詳しい音声案内」をオンにすると、徒歩ナビ中により詳しい音声案内を利用できます。
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
      <footer className="mt-auto border-t bg-white py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex space-x-6">
              <Link
                target="_blank"
                href="https://forms.gle/iLpwuWmAXXtRFj6v5"
                className="text-sm text-gray-600 hover:text-blue-500 hover:underline"
              >
                お問い合わせ
              </Link>
              <Link
                target="_blank"
                href="https://sites.google.com/view/silverbirders-services"
                className="text-sm text-gray-600 hover:text-blue-500 hover:underline"
              >
                関連サービス
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} silverbirder. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
