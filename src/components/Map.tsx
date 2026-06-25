import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type Model3D } from "./ModelViewer";

const NORMAL_POI_ICON = L.divIcon({
    html: `<div class="bg-white rounded-full w-6 h-6 border-2 border-slate-400 shadow-md"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const SELECTED_POI_ICON = L.divIcon({
    html: `<div class="bg-amber-500 rounded-full w-9 h-9 border-2 border-white shadow-xl ring-4 ring-amber-500/30 flex items-center justify-center animate-bounce">
             <div class="bg-white rounded-full w-3 h-3"></div>
           </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

export interface MapPoint {
    id: string;
    title: string;
    lat: number;
    lon: number;
    author: string;
    description: string;
    content: string;
    model3d?: Model3D;
    audio?: {
        title?: string;
        url: string;
    };
}

interface MapProps {
    className?: string;
    points: MapPoint[];
    selectedPoint: MapPoint | null;
    onPointSelect: (point: MapPoint | null) => void;
    onMapClick?: (lat: number, lon: number) => void;
    isPickingLocation?: boolean;
    distanceFilter?: {
        enabled: boolean;
        lat: number;
        lon: number;
        radius: number;
    };
    onDistanceFilterChange?: (lat: number, lon: number) => void;
}

const BUTZBACH_POSITION: [number, number] = [50.4331924, 8.6733298];

const DISTANCE_MARKER_ICON = L.divIcon({
    html: `<div class="bg-blue-600 rounded-full w-8 h-8 border-2 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-blue-600/20">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
           </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

function MapContent({ selectedPoint }: { selectedPoint: MapPoint | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedPoint) {
            const targetPoint = [selectedPoint.lat, selectedPoint.lon] as [number, number];
            const isMobile = window.innerWidth < 768;

            if (isMobile) {
                map.flyTo(targetPoint, 17, { duration: 1.5 });
            } else {
                map.flyTo(targetPoint, 17, { duration: 1.5 });
                const point = map.project(targetPoint, 17);
                const offsetPoint = point.add([window.innerWidth / 6, 0]);
                const targetLatLng = map.unproject(offsetPoint, 17);
                map.flyTo(targetLatLng, 17, { duration: 1.5 });
            }
        }
    }, [selectedPoint, map]);

    return null;
}

function MapClickHandler({
    onMapClick,
    isPickingLocation,
    onDeselect
}: {
    onMapClick?: (lat: number, lon: number) => void,
    isPickingLocation?: boolean,
    onDeselect: () => void
}) {
    useMapEvents({
        click(e) {
            if (isPickingLocation && onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            } else {
                onDeselect();
            }
        },
    });
    return null;
}

function DistanceFilterLayer({ distanceFilter, onDistanceFilterChange, isPickingLocation }: {
    distanceFilter: NonNullable<MapProps["distanceFilter"]>,
    onDistanceFilterChange?: (lat: number, lon: number) => void,
    isPickingLocation?: boolean
}) {
    // Local state to track the marker's position during active dragging
    const [localState, setLocalState] = useState({
        position: [distanceFilter.lat, distanceFilter.lon] as [number, number],
        sourceLat: distanceFilter.lat,
        sourceLon: distanceFilter.lon,
    });
    const [isDragging, setIsDragging] = useState(false);
    const localPos = useMemo<[number, number]>(() => {
        const hasExternalPosition =
            localState.sourceLat !== distanceFilter.lat ||
            localState.sourceLon !== distanceFilter.lon;

        return !isDragging && hasExternalPosition
            ? [distanceFilter.lat, distanceFilter.lon]
            : localState.position;
    }, [
        distanceFilter.lat,
        distanceFilter.lon,
        isDragging,
        localState.position,
        localState.sourceLat,
        localState.sourceLon,
    ]);

    // Debounced update during drag: if mouse is still for 200ms, update the app state
    useEffect(() => {
        if (!isDragging) return;

        const timer = setTimeout(() => {
            onDistanceFilterChange?.(localPos[0], localPos[1]);
        }, 100);

        return () => clearTimeout(timer);
    }, [localPos, isDragging, onDistanceFilterChange]);

    return (
        <>
            <Circle
                center={localPos}
                radius={distanceFilter.radius * 1000}
                pathOptions={{
                    color: "#2563eb",
                    weight: 3,
                    fillColor: "#2563eb",
                    fillOpacity: 0.15,
                    dashArray: isPickingLocation ? "5, 10" : undefined
                }}
            />
            <Marker
                position={localPos}
                icon={DISTANCE_MARKER_ICON}
                draggable={true}
                eventHandlers={{
                    dragstart: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        setLocalState({
                            position: [position.lat, position.lng],
                            sourceLat: distanceFilter.lat,
                            sourceLon: distanceFilter.lon,
                        });
                        setIsDragging(true);
                    },
                    drag: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        setLocalState({
                            position: [position.lat, position.lng],
                            sourceLat: distanceFilter.lat,
                            sourceLon: distanceFilter.lon,
                        });
                    },
                    dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        onDistanceFilterChange?.(position.lat, position.lng);
                        setIsDragging(false);
                    }
                }}
            />
        </>
    );
}

export function Map({
    className,
    points,
    selectedPoint,
    onPointSelect,
    onMapClick,
    isPickingLocation,
    distanceFilter,
    onDistanceFilterChange
}: MapProps) {
    return (
        <div className={className}>
            <MapContainer
                center={BUTZBACH_POSITION}
                zoom={14}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapContent selectedPoint={selectedPoint} />
                <MapClickHandler
                    onMapClick={onMapClick}
                    isPickingLocation={isPickingLocation}
                    onDeselect={() => onPointSelect(null)}
                />

                {distanceFilter?.enabled && (
                    <DistanceFilterLayer
                        distanceFilter={distanceFilter}
                        onDistanceFilterChange={onDistanceFilterChange}
                        isPickingLocation={isPickingLocation}
                    />
                )}

                {points.map((point) => (
                    <Marker
                        key={point.id}
                        position={[point.lat, point.lon]}
                        icon={String(selectedPoint?.id) === String(point.id) ? SELECTED_POI_ICON : NORMAL_POI_ICON}
                        eventHandlers={{
                            click: () => onPointSelect(point),
                        }}
                    >
                        <Tooltip
                            key={String(selectedPoint?.id) === String(point.id) ? "permanent" : "hover"}
                            direction="top"
                            offset={[0, -20]}
                            opacity={1}
                            permanent={String(selectedPoint?.id) === String(point.id)}
                            className="custom-tooltip !whitespace-normal"
                        >
                            <div className="font-sans w-[200px] md:w-[250px]">
                                <h3 className="font-bold text-base leading-tight mb-1">{point.title}</h3>
                                <p className="text-sm text-muted-foreground break-words leading-snug">{point.description}</p>
                            </div>
                        </Tooltip>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
