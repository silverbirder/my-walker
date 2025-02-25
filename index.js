const API_KEY = process.env.GRAPHOPPER_API_KEY;
const BASE_URL = "https://graphhopper.com/api/1/route";

// 現在地
const startLat = process.env.START_LAT;
const startLon = process.env.START_LON;
const distance = 1000; // 1000m
const seed = Math.floor(Math.random() * 1000); // ランダムシード

async function getWalkingRoute() {
  try {
    const params = new URLSearchParams({
      point: `${startLat},${startLon}`,
      vehicle: "foot",
      algorithm: "round_trip",
      "ch.disable": "true",
      "round_trip.distance": distance.toString(),
      "round_trip.seed": seed.toString(),
      locale: "ja",
      points_encoded: "false",
      key: API_KEY ?? "",
    });

    const url = `${BASE_URL}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (!data.paths || data.paths.length === 0)
      throw new Error("ルートが見つかりません");

    const points = data.paths[0].points.coordinates;
    console.log("取得したルートの緯度経度:", points);

    if (points.length > 10) {
      console.warn("経由地が多すぎるため、一部削除します");
      const reducedPoints = [
        points[0],
        ...points.filter((_, i) => i % Math.ceil(points.length / 9) === 0),
        points[points.length - 1],
      ];
      console.log("簡略化後の経由地:", reducedPoints);

      points.length = 0;
      points.push(...reducedPoints);
    }

    // Google Maps の URL を作成
    const googleMapsUrl = `https://www.google.co.jp/maps/dir/${points
      .map((p) => `${p[1]},${p[0]}`)
      .join("/")}/`;

    console.log("Google Maps で開く:", googleMapsUrl);
  } catch (error) {
    console.error("ルート取得に失敗しました:", error.message);
  }
}

getWalkingRoute();
