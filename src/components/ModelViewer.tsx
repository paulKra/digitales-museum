import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    AmbientLight,
    Box3,
    Color,
    DirectionalLight,
    DoubleSide,
    LoadingManager,
    Material,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Scene,
    SRGBColorSpace,
    Texture,
    Vector3,
    WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Button } from "@/components/ui/button";
import { getPublicAssetDirectory, getPublicAssetUrl } from "@/lib/public-assets";

export interface Model3D {
    title: string;
    glbUrl?: string;
}

interface ModelViewerProps {
    model: Model3D;
}

function prepareObjectForViewing(object: Object3D) {
    object.traverse((child) => {
        if (!(child instanceof Mesh)) return;

        const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

        materials.filter(Boolean).forEach((material: Material) => {
            material.side = DoubleSide;
            material.needsUpdate = true;

            const texturedMaterial = material as Material & { map?: Texture };
            if (texturedMaterial.map) {
                texturedMaterial.map.colorSpace = SRGBColorSpace;
            }
        });
    });
}

function disposeObject(object: Object3D) {
    object.traverse((child) => {
        if (!(child instanceof Mesh)) return;

        child.geometry?.dispose();

        const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

        materials.filter(Boolean).forEach((material: Material) => {
            Object.values(material as unknown as Record<string, unknown>).forEach((value) => {
                if (value instanceof Texture) {
                    value.dispose();
                }
            });
            material.dispose();
        });
    });
}

export function ModelViewer({ model }: ModelViewerProps) {
    const canvasHostRef = useRef<HTMLDivElement | null>(null);
    const resetViewRef = useRef<() => void>(() => {});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [status, setStatus] = useState(() =>
        model.glbUrl
            ? "3D-Modell wird geladen..."
            : "Kein 3D-Modell angegeben.",
    );

    useEffect(() => {
        const canvasHost = canvasHostRef.current;
        if (!canvasHost) return;

        const { glbUrl } = model;
        if (!glbUrl) return;
        const resolvedGlbUrl = getPublicAssetUrl(glbUrl);

        let frameId = 0;
        let isMounted = true;
        let loadedObject: Object3D | null = null;
        let settlingFrames = 0;
        const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

        const scene = new Scene();
        scene.background = new Color(0xe2e8f0);

        const camera = new PerspectiveCamera(45, 1, 0.01, 10000);
        camera.position.set(0, 1.5, 4);

        const renderer = new WebGLRenderer({
            antialias: !isTouchDevice,
            alpha: false,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 1.5));
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.domElement.className = "block h-full w-full";
        renderer.domElement.dataset.testid = "model-viewer-canvas";
        renderer.domElement.style.touchAction = "none";
        canvasHost.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = true;
        controls.autoRotate = false;
        controls.screenSpacePanning = true;
        controls.zoomSpeed = isTouchDevice ? 0.45 : 0.65;
        controls.zoomToCursor = true;

        const ambientLight = new AmbientLight(0xffffff, 1.9);
        const keyLight = new DirectionalLight(0xffffff, 2.4);
        const fillLight = new DirectionalLight(0xb7d4ff, 1.2);
        keyLight.position.set(3, 5, 4);
        fillLight.position.set(-4, 2, -3);
        scene.add(ambientLight, keyLight, fillLight);

        const renderScene = () => {
            frameId = 0;
            if (!isMounted) return;

            const controlsChanged = controls.update();
            renderer.render(scene, camera);
            if (controlsChanged || settlingFrames > 0) {
                settlingFrames = Math.max(settlingFrames - 1, 0);
                requestRender();
            }
        };

        const requestRender = () => {
            if (frameId || !isMounted) return;
            frameId = window.requestAnimationFrame(renderScene);
        };

        const requestSettledRender = () => {
            settlingFrames = 24;
            requestRender();
        };

        controls.addEventListener("change", requestSettledRender);

        const resize = () => {
            const { width, height } = canvasHost.getBoundingClientRect();
            if (width === 0 || height === 0) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            requestRender();
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvasHost);
        resize();

        const fitObjectToView = (object: Object3D) => {
            const bounds = new Box3().setFromObject(object);
            const center = bounds.getCenter(new Vector3());
            const size = bounds.getSize(new Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            const distance = maxDimension / (2 * Math.tan((camera.fov * Math.PI) / 360));
            const closeUpDistance = Math.max(maxDimension * 0.001, 0.0001);

            object.position.set(-center.x, -center.y, -center.z);
            camera.near = Math.max(maxDimension / 100000, 0.0001);
            camera.far = Math.max(distance * 100, maxDimension * 100, 1000);
            camera.position.set(distance * 0.52, distance * 0.34, distance * 0.86);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            controls.target.set(0, 0, 0);
            controls.cursor.set(0, 0, 0);
            controls.minDistance = closeUpDistance;
            controls.maxDistance = distance * 8;
            controls.minTargetRadius = 0;
            controls.maxTargetRadius = maxDimension * 2;
            controls.update();

            const homePosition = camera.position.clone();
            const homeTarget = controls.target.clone();
            resetViewRef.current = () => {
                camera.position.copy(homePosition);
                controls.target.copy(homeTarget);
                controls.update();
                requestSettledRender();
            };
        };

        const onModelLoaded = (object: Object3D) => {
            if (!isMounted) return;

            prepareObjectForViewing(object);
            loadedObject = object;
            scene.add(object);
            fitObjectToView(object);
            setStatus("");
            requestRender();
        };

        const onLoadError = () => {
            if (isMounted) {
                setStatus("Das 3D-Modell konnte nicht geladen werden.");
            }
        };

        const manager = new LoadingManager(undefined, undefined, (url) => {
            if (isMounted) {
                setStatus(`Konnte ${url.split("/").pop() || "Modell"} nicht laden.`);
            }
        });

        const dracoLoader = new DRACOLoader(manager);
        dracoLoader.setDecoderPath(getPublicAssetDirectory("/draco/"));

        const gltfLoader = new GLTFLoader(manager);
        gltfLoader.setDRACOLoader(dracoLoader);
        gltfLoader.load(
            resolvedGlbUrl,
            (gltf) => onModelLoaded(gltf.scene),
            undefined,
            onLoadError,
        );
        requestRender();

        return () => {
            isMounted = false;
            window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            controls.removeEventListener("change", requestSettledRender);
            controls.dispose();
            if (loadedObject) {
                scene.remove(loadedObject);
                disposeObject(loadedObject);
            }
            dracoLoader.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            resetViewRef.current = () => {};
        };
    }, [model]);

    const frameClassName = isFullscreen
        ? "fixed inset-0 z-50 h-[100dvh] min-h-0 overflow-hidden rounded-none border-0 bg-slate-200"
        : "relative h-[min(58dvh,460px)] min-h-[280px] overflow-hidden rounded-md border bg-slate-200 md:h-[460px]";

    return (
        <div className="space-y-3 not-prose">
            <div
                className={frameClassName}
                aria-label={model.title}
            >
                <div ref={canvasHostRef} className="absolute inset-0" />
                <div className="absolute right-3 top-3 z-20 flex gap-2">
                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="bg-background/90 shadow-sm backdrop-blur"
                        onClick={() => resetViewRef.current()}
                        aria-label="3D-Ansicht zurücksetzen"
                        title="Ansicht zurücksetzen"
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="bg-background/90 shadow-sm backdrop-blur"
                        onClick={() => setIsFullscreen((current) => !current)}
                        aria-label={isFullscreen ? "Vollbild schließen" : "3D-Modell im Vollbild anzeigen"}
                        title={isFullscreen ? "Vollbild schließen" : "Vollbild"}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Maximize2 className="h-4 w-4" aria-hidden="true" />
                        )}
                    </Button>
                </div>
                {status && (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-slate-200 text-sm text-muted-foreground">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
