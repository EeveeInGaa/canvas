export const CanvasSizePreset = {
	A4: 'a4',
	A5: 'a5',
	Letter: 'letter',
} as const;

export type CanvasSizePreset =
	(typeof CanvasSizePreset)[keyof typeof CanvasSizePreset];

export const CanvasOrientation = {
	Portrait: 'portrait',
	Landscape: 'landscape',
} as const;

export type CanvasOrientation =
	(typeof CanvasOrientation)[keyof typeof CanvasOrientation];

export type CanvasSpace =
	| { kind: 'infinite' }
	| {
			kind: 'bounded';
			preset: CanvasSizePreset;
			orientation: CanvasOrientation;
	  };
