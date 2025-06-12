import MapReact from "./MapReact";
import { useRef, useState } from "react";
import type { CollectionEntry } from "astro:content";

interface MapViewProps {
  locations: CollectionEntry<"band1">[];
}

const MapView: React.FC<MapViewProps> = (props: MapViewProps) => {
  const mapRef = useRef<L.Map>(null);
  const [fetchedLocation, setFetchedLocation] = useState<string>();

  const handleMarkerClick = async (location: CollectionEntry<"band1">) => {
    console.log(location);
    mapRef.current?.flyTo([location.data.lat, location.data.lon]);
    const fetched = await fetch("content/" + location.id + ".html");
    setFetchedLocation(await fetched.text());
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1">
          <MapReact
            markers={props.locations}
            ref={mapRef}
            handleClick={handleMarkerClick}
          />
        </div>
        <div className="w-full md:w-1/3 bg-gray-100 p-4 overflow-y-auto max-h-screen">
          <h2 className="text-xl font-bold mb-4">Locations</h2>
          <ul className="space-y-2">
            {props.locations.map((location) => (
              <li
                key={location.id}
                className="cursor-pointer p-2 bg-white shadow rounded hover:bg-gray-200"
                onClick={() => handleMarkerClick(location)}
              >
                {location.data.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {fetchedLocation && (
        <div className="mt-4">
          <h1 className="text-3xl text-accent-foreground mx-auto mt-4 text-center border-b-2 border-accent-foreground max-w-4xl">
            Ausgewähltes Exponat
          </h1>
          <article
            className="prose mx-auto columns-2 max-w-4xl p-2.5 gap-2"
            dangerouslySetInnerHTML={{
              __html: fetchedLocation,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MapView;
