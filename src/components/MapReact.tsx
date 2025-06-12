import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import type { CollectionEntry } from "astro:content";
import "leaflet/dist/leaflet.css";
import L from "leaflet"; // Import Leaflet
import { Button } from "@/components/ui/button";

interface MapProps {
  ref: React.RefObject<L.Map | null>;
  markers: CollectionEntry<"band1">[];
  handleClick: (location: CollectionEntry<"band1">) => void;
}
const MapReact: React.FC<MapProps> = ({
  markers,
  ref,
  handleClick,
}: MapProps) => {
  const hometownCenter: [number, number] = [50.437069, 8.67361];

  return (
    <>
      <MapContainer
        center={[hometownCenter[0], hometownCenter[1]]}
        zoom={13}
        ref={ref}
        className="h-[60vh] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.data.lat, marker.data.lon]}
            eventHandlers={{ click: () => handleClick(marker) }}
          >
            <Popup>
              <div>
                <h3>{marker.data.title}</h3>
                <p>{marker.data.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <Marker position={[hometownCenter[0], hometownCenter[1]]}>
          <Popup>Museum Butzbach</Popup>
        </Marker>
      </MapContainer>
    </>
  );
};

export default MapReact;
