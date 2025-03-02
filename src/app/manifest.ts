import type { MetadataRoute } from "next";
import { iconSizes } from "./icon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "散歩コース生成",
    short_name: "散歩コース",
    description:
      "現在地から出発し、同じ場所に戻ってくる散歩コースをGoogle Mapで案内します",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    icons: iconSizes.map((size) => ({
      src: `/icon/${size}`,
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
  };
}
