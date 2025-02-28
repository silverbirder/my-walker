import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

type Props = {
  center: [number, number];
  points?: [number, number][];
};

export const Map = ({ center, points }: Props) => {
  return (
    <MapContainer center={center} zoom={16} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={center} />
      {points && <Polyline positions={points.map(([a, b]) => [b, a])} />}
    </MapContainer>
  );
};
