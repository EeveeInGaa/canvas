import type { Rect } from '@/canvas/types/geometry.types.ts';

export type CanvasNodeType = 'text';

export type CanvasNode = Rect & {
	id: string;
	type: CanvasNodeType;
	text: string;
};
