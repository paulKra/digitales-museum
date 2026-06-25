import { Box, FileText } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type MapPoint } from "./Map";

const ModelViewer = lazy(() =>
    import("./ModelViewer").then((module) => ({ default: module.ModelViewer })),
);

interface ContentViewerProps {
    point: MapPoint | null;
    onClose: () => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export function ContentViewer({ point, onClose, isExpanded, onToggleExpand }: ContentViewerProps) {
    const [activeView, setActiveView] = useState<"model" | "content">(() => point?.model3d ? "model" : "content");

    if (!point) return null;

    const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${point.lat},${point.lon}`)}&travelmode=walking`;
    const hasModel = Boolean(point.model3d);

    return (
        <div className="max-w-none flex h-full flex-col bg-card text-card-foreground shadow-lg animate-in slide-in-from-bottom duration-300">
            <header className="flex shrink-0 items-center justify-between border-b px-6 py-4">
                <div>
                    <h2 className="text-xl font-bold">{point.title}</h2>
                    <p className="text-sm text-muted-foreground">von {point.author}</p>
                </div>
                <div className="flex items-center gap-1">
                    <a
                        href={googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full p-2 hover:bg-muted"
                        aria-label="Route in Google Maps öffnen"
                        title="Route in Google Maps öffnen"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14 3.5 5.5 12l8.5 8.5" />
                            <path d="M20 12H6" />
                        </svg>
                    </a>
                    <button
                        onClick={onToggleExpand}
                        className="rounded-full p-2 hover:bg-muted hidden md:block"
                        aria-label={isExpanded ? "Verkleinern" : "Vergrößern"}
                        title={isExpanded ? "Ansicht verkleinern" : "Ansicht vergrößern"}
                    >
                        {isExpanded ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h6v6" /><path d="M14 10l7-7" /><path d="M9 21H3v-6" /><path d="M10 14l-7 7" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-muted"
                        aria-label="Schließen"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {hasModel && (
                    <div className="mb-5 inline-flex rounded-md border bg-muted/40 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveView("model")}
                            className={`inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors ${activeView === "model" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Box className="h-4 w-4" aria-hidden="true" />
                            3D
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveView("content")}
                            className={`inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors ${activeView === "content" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Text
                        </button>
                    </div>
                )}

                {activeView === "model" && point.model3d ? (
                    <Suspense
                        fallback={
                            <div className="grid h-[360px] place-items-center rounded-md border bg-slate-50 text-sm text-muted-foreground md:h-[460px]">
                                3D-Ansicht wird vorbereitet...
                            </div>
                        }
                    >
                        <ModelViewer model={point.model3d} />
                    </Suspense>
                ) : (
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {point.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
