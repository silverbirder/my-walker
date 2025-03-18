import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const API_KEY = process.env.GRAPHOPPER_API_KEY;
const BASE_URL = "https://graphhopper.com/api/1/route";

interface GraphHopperResponse {
  paths?: {
    points: {
      coordinates: [number, number][];
    };
  }[];
}

export const routeRouter = createTRPCRouter({
  getWalkingRoute: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        distance: z.number().positive(),
        maxPoints: z.number().int().positive().default(10),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { latitude, longitude, distance, maxPoints } = input;
        const seed = Math.floor(Math.random() * 1000);

        const params = new URLSearchParams({
          point: `${latitude},${longitude}`,
          vehicle: "foot",
          algorithm: "round_trip",
          // "Free packages cannot use flexible mode" エラー回避
          // FlexibleModeを使わない。
          // https://github.com/graphhopper/graphhopper/blob/master/docs/core/routing.md
          // "ch.disable": "true",
          "round_trip.distance": distance.toString(),
          "round_trip.seed": seed.toString(),
          locale: "ja",
          points_encoded: "false",
          key: API_KEY ?? "",
        });

        const url = `${BASE_URL}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = (await response.json()) as GraphHopperResponse;
        if (
          !data.paths ||
          data.paths.length === 0 ||
          !data.paths[0]?.points.coordinates
        )
          throw new Error("ルートが見つかりません");

        let points: [number, number][] = data.paths[0].points.coordinates;

        if (points.length > maxPoints) {
          const firstPoint = points[0]!; // 最初のポイント
          const lastPoint = points[points.length - 1]!; // 最後のポイント
          const middlePoints = points.slice(1, points.length - 1); // 間のポイント

          // 間のポイントを maxPoints - 2 に間引く
          const step = Math.ceil(middlePoints.length / (maxPoints - 2));
          const reducedMiddlePoints = middlePoints.filter(
            (_, i) => i % step === 0,
          );

          // 必ず最初と最後のポイントを含める
          points = [firstPoint, ...reducedMiddlePoints, lastPoint].slice(
            0,
            maxPoints,
          );
        }

        const googleMapsUrl = `https://www.google.co.jp/maps/dir/${points
          .map((p) => `${p[1]},${p[0]}`)
          .join("/")}/`;

        return {
          points,
          originalPoints: data.paths[0].points.coordinates,
          googleMapsUrl,
        };
      } catch (error) {
        throw new Error(
          `ルート取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        );
      }
    }),
});
