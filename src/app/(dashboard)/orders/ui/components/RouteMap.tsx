"use client";

import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  from: [number, number];
  to: [number, number];
  polyline?: [number, number][];
};

export default function RouteMap({ from, to, polyline }: Props) {
  const center = useMemo<LatLngExpression>(() => {
    return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  }, [from, to]);

  const line = useMemo<LatLngExpression[]>(
    () => (polyline?.length ? polyline : [from, to]),
    [polyline, from, to],
  );

  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={from}>
        <Popup>Yuboruvchi</Popup>
      </Marker>

      <Marker position={to}>
        <Popup>Qabul qiluvchi</Popup>
      </Marker>

      <Polyline positions={line} />
    </MapContainer>
  );
}
