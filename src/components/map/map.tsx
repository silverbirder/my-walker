import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Pane,
  Rectangle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { CSSProperties } from "react";

L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

type Props = {
  center: [number, number];
  points?: [number, number][];
  isSearching?: boolean;
};

export const Map = ({ center, points, isSearching }: Props) => {
  const bounds: [number, number][] = [
    [center[0] + 0.05, center[1] - 0.05],
    [center[0] - 0.05, center[1] + 0.05],
  ];

  const overlayStyle: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "white",
    fontWeight: "bold",
    fontSize: "18px",
    zIndex: 400,
  };

  return (
    <div className="relative h-full w-full" style={{ zIndex: 0 }}>
      <MapContainer
        center={center}
        zoom={16}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center} />
        {!isSearching && points && (
          <Polyline positions={points.map(([a, b]) => [b, a])} />
        )}
        {isSearching && (
          <>
            <Pane name="searching-overlay" style={{ zIndex: 300 }}>
              <Rectangle
                bounds={bounds as L.LatLngBoundsLiteral}
                pathOptions={{ color: "rgba(0, 0, 0, 0.5)", fillOpacity: 0.5 }}
              />
            </Pane>
            <div style={overlayStyle}>検索中...</div>
          </>
        )}
      </MapContainer>
    </div>
  );
};
