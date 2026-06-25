import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChevronDown,
    Crosshair,
    MapPin,
    Search,
    SlidersHorizontal,
    User,
    X,
} from "lucide-react";
import { useState, type ChangeEvent } from "react";

export interface FilterState {
    searchTerm: string;
    author: string;
    distance: {
        enabled: boolean;
        lat: number;
        lon: number;
        radius: number;
    };
}

interface FilterBarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    authors: string[];
    isPickingLocation: boolean;
    onPickingLocationChange: (isPicking: boolean) => void;
}

export function FilterBar({
    filters,
    onFiltersChange,
    authors,
    isPickingLocation,
    onPickingLocationChange
}: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeFilterCount =
        Number(Boolean(filters.searchTerm.trim())) +
        Number(Boolean(filters.author)) +
        Number(filters.distance.enabled);

    const searchSummary = filters.searchTerm.trim();

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, searchTerm: e.target.value });
    };

    const handleClearSearch = () => {
        onFiltersChange({ ...filters, searchTerm: "" });
    };

    const handleAuthorChange = (value: string) => {
        onFiltersChange({ ...filters, author: value === "all" ? "" : value });
    };

    const handleDistanceEnableChange = (enabled: boolean) => {
        onFiltersChange({
            ...filters,
            distance: { ...filters.distance, enabled },
        });
    };

    const handleDistanceValueChange = (
        field: "lat" | "lon" | "radius",
        value: string
    ) => {
        const numValue = parseFloat(value) || 0;
        onFiltersChange({
            ...filters,
            distance: { ...filters.distance, [field]: numValue },
        });
    };

    return (
        <div className="border-b bg-muted/30">
            <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    aria-expanded={isOpen}
                    aria-controls="location-filter-panel"
                    onClick={() => setIsOpen((open) => !open)}
                >
                    <SlidersHorizontal className="size-4" />
                    Filter
                    {activeFilterCount > 0 && (
                        <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                            {activeFilterCount}
                        </span>
                    )}
                    <ChevronDown
                        className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                </Button>
                <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                    {searchSummary ? (
                        <span className="block truncate">
                            Suche: {searchSummary}
                        </span>
                    ) : (
                        <span>{activeFilterCount > 0 ? "Filter aktiv" : "Alle Orte"}</span>
                    )}
                </div>
            </div>

            <div
                id="location-filter-panel"
                className={`${isOpen ? "grid" : "hidden"} gap-4 px-4 pb-4 md:flex md:flex-wrap md:items-end md:gap-6 md:px-6 md:py-4`}
            >
                <div className="flex min-w-0 flex-col gap-2 md:min-w-[220px] md:flex-1">
                    <Label
                        htmlFor="search"
                        className="inline-flex items-center gap-2 font-medium text-muted-foreground"
                    >
                        <Search className="size-3" />
                        Suchen
                    </Label>
                    <div className="relative">
                        <Input
                            id="search"
                            placeholder="Keywords..."
                            value={filters.searchTerm}
                            onChange={handleSearchChange}
                            className="bg-background pr-9"
                        />
                        {filters.searchTerm && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                                onClick={handleClearSearch}
                                aria-label="Suche löschen"
                            >
                                <X className="size-4 text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-2 md:min-w-[170px]">
                    <Label
                        htmlFor="author"
                        className="inline-flex items-center gap-2 font-medium text-muted-foreground"
                    >
                        <User className="size-3" />
                        Autor
                    </Label>
                    <Select value={filters.author || "all"} onValueChange={handleAuthorChange}>
                        <SelectTrigger id="author" className="w-full bg-background">
                            <SelectValue placeholder="Alle Autoren" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Autoren</SelectItem>
                            {authors.map((author) => (
                                <SelectItem key={author} value={author}>
                                    {author}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex min-w-0 flex-col gap-3 rounded-md border bg-background/50 p-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="distance-enable"
                            checked={filters.distance.enabled}
                            onChange={(e) => handleDistanceEnableChange(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <Label
                            htmlFor="distance-enable"
                            className="inline-flex cursor-pointer items-center gap-2 font-medium text-muted-foreground"
                        >
                            <MapPin className="size-3" />
                            Umkreis Filter
                        </Label>
                    </div>
                    <div
                        className={`grid grid-cols-2 items-end gap-2 transition-opacity sm:grid-cols-[90px_1fr_1fr_auto] md:flex ${filters.distance.enabled ? "opacity-100" : "pointer-events-none opacity-40"}`}
                    >
                        <div className="flex min-w-0 flex-col gap-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Radius (km)</Label>
                            <Input
                                type="number"
                                value={filters.distance.radius}
                                onChange={(e) => handleDistanceValueChange("radius", e.target.value)}
                                className="w-full bg-background md:w-20"
                                min="0"
                            />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Lat</Label>
                            <Input
                                type="number"
                                value={filters.distance.lat}
                                onChange={(e) => handleDistanceValueChange("lat", e.target.value)}
                                className="w-full bg-background md:w-24"
                            />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Lon</Label>
                            <Input
                                type="number"
                                value={filters.distance.lon}
                                onChange={(e) => handleDistanceValueChange("lon", e.target.value)}
                                className="w-full bg-background md:w-24"
                            />
                        </div>
                        <Button
                            type="button"
                            variant={isPickingLocation ? "default" : "outline"}
                            size="icon"
                            onClick={() => onPickingLocationChange(!isPickingLocation)}
                            className={`shrink-0 ${isPickingLocation ? "animate-pulse" : ""}`}
                            title="Ort auf der Karte wählen"
                        >
                            <Crosshair className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
