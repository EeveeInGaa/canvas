import type {Viewport} from "@/canvas/Canvas.ts";

export function createId(): string {
    return crypto.randomUUID();
}

export function clampSize(value: number): number {
    return Math.max(80, value);
}

export function screenToCanvas(params: {
    screenX: number;
    screenY: number;
    canvasRect: DOMRect;
    viewport: Viewport;
}) {
    const localX = params.screenX - params.canvasRect.left;
    const localY = params.screenY - params.canvasRect.top;

    return {
        x: (localX - params.viewport.x) / params.viewport.scale,
        y: (localY - params.viewport.y) / params.viewport.scale,
    };
}

export function clampScale(scale: number): number {
    return Math.min(Math.max(scale, 0.25), 3);
}