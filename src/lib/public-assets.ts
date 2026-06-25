const absoluteUrlPattern = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;

export function getPublicAssetUrl(path: string) {
    if (
        absoluteUrlPattern.test(path) ||
        path.startsWith("blob:") ||
        path.startsWith("data:")
    ) {
        return path;
    }

    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = path.replace(/^\/+/, "");

    return `${normalizedBase}/${normalizedPath}`;
}

export function getPublicAssetDirectory(path: string) {
    const url = getPublicAssetUrl(path);
    return url.endsWith("/") ? url : `${url}/`;
}
