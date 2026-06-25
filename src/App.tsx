import { useState, useMemo, useEffect } from "react";
import { Map, type MapPoint } from "@/components/Map";
import { ContentViewer } from "@/components/ContentViewer";
import { FilterBar, type FilterState } from "@/components/FilterBar";
import { getDistance } from "@/lib/geo";
import pointsData from "@/assets/generated/points.json";

const points = pointsData as unknown as MapPoint[];

// Initial position for distance filter (Butzbach center)
const BUTZBACH_POSITION = { lat: 50.4331924, lon: 8.6733298 };

export function App() {
    // 1. Initial State from URL
    const getInitialFilters = (): FilterState => {
        const params = new URLSearchParams(window.location.search);
        return {
            searchTerm: params.get("q") || "",
            author: params.get("author") || "",
            distance: {
                enabled: params.get("dist") === "1",
                lat: parseFloat(params.get("lat") || BUTZBACH_POSITION.lat.toString()),
                lon: parseFloat(params.get("lon") || BUTZBACH_POSITION.lon.toString()),
                radius: parseFloat(params.get("rad") || "5"),
            },
        };
    };

    const getInitialSelectedPoint = (): MapPoint | null => {
        const params = new URLSearchParams(window.location.search);
        const poiId = params.get("poi");
        if (poiId) {
            return points.find(p => String(p.id) === String(poiId)) || null;
        }
        return null;
    };

    const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(getInitialSelectedPoint);
    const [filters, setFilters] = useState<FilterState>(getInitialFilters);
    const [isExpanded, setIsExpanded] = useState(true);

    // 2. Sync State to URL
    useEffect(() => {
        const params = new URLSearchParams();

        if (filters.searchTerm) params.set("q", filters.searchTerm);
        if (filters.author) params.set("author", filters.author);
        if (filters.distance.enabled) {
            params.set("dist", "1");
            params.set("lat", filters.distance.lat.toFixed(6));
            params.set("lon", filters.distance.lon.toFixed(6));
            params.set("rad", filters.distance.radius.toString());
        }
        if (selectedPoint) {
            params.set("poi", selectedPoint.id);
        }

        const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
        window.history.replaceState(null, "", newUrl);
    }, [filters, selectedPoint]);

    const [isPickingLocation, setIsPickingLocation] = useState(false);

    const authors = useMemo(() => {
        const allAuthors = new Set<string>();
        points.forEach((p) => {
            if (p.author) {
                p.author.split(",").forEach((a) => {
                    const trimmed = a.trim();
                    if (trimmed) allAuthors.add(trimmed);
                });
            }
        });
        return Array.from(allAuthors).sort();
    }, []);

    const filteredPoints = useMemo(() => {
        const searchLower = filters.searchTerm.trim().toLowerCase();

        return points.filter((point) => {
            // Search term filter
            if (searchLower) {
                const matchesSearch =
                    (point.title?.toLowerCase().includes(searchLower)) ||
                    (point.description?.toLowerCase().includes(searchLower)) ||
                    (point.content?.toLowerCase().includes(searchLower));

                if (!matchesSearch) return false;
            }

            // Author filter
            if (filters.author) {
                const pointAuthors = point.author
                    ? point.author.split(",").map((a) => a.trim())
                    : [];
                if (!pointAuthors.includes(filters.author)) {
                    return false;
                }
            }

            // Distance filter
            if (filters.distance.enabled) {
                const dist = getDistance(
                    filters.distance.lat,
                    filters.distance.lon,
                    point.lat,
                    point.lon
                );
                if (dist > filters.distance.radius) {
                    return false;
                }
            }

            return true;
        });
    }, [filters]);

    const handleDistanceCenterChange = (lat: number, lon: number) => {
        setFilters({
            ...filters,
            distance: {
                ...filters.distance,
                enabled: true,
                lat,
                lon,
            },
        });
    };

    const handleMapClick = (lat: number, lon: number) => {
        handleDistanceCenterChange(lat, lon);
        setIsPickingLocation(false);
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
            <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:h-16 md:px-6">
                <h1 className="truncate text-base font-bold tracking-tight md:text-2xl">
                    Digitales Museum Butzbach
                </h1>
                <div className="hidden shrink-0 text-sm text-muted-foreground sm:block">
                    {filteredPoints.length} von {points.length} Orten gefunden
                </div>
            </header>

            <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                authors={authors}
                isPickingLocation={isPickingLocation}
                onPickingLocationChange={setIsPickingLocation}
            />

            <main className="relative flex-1 overflow-hidden flex">
                <div className="absolute inset-0 z-0">
                    <Map
                        className="h-full w-full"
                        points={filteredPoints}
                        selectedPoint={selectedPoint}
                        onPointSelect={setSelectedPoint}
                        onMapClick={handleMapClick}
                        isPickingLocation={isPickingLocation}
                        distanceFilter={filters.distance}
                        onDistanceFilterChange={handleDistanceCenterChange}
                    />
                </div>

                {selectedPoint && (
                    <div className={`absolute inset-y-0 right-0 z-10 bg-background/95 backdrop-blur-md shadow-2xl border-l animate-in slide-in-from-right duration-300 ${isExpanded ? "w-full md:w-2/3 lg:w-1/2" : "w-full md:w-1/2 lg:w-1/3"}`}>
                        <ContentViewer
                            key={selectedPoint.id}
                            point={selectedPoint}
                            onClose={() => setSelectedPoint(null)}
                            isExpanded={isExpanded}
                            onToggleExpand={() => setIsExpanded(!isExpanded)}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
