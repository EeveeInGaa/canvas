import type { Rect } from '@/canvas/types/geometry.types.ts';

export type CanvasNodeType = 'text';

export type CanvasNode = Rect & {
	id: string;
	type: CanvasNodeType;
	text: string;
};

export type CanvasGroup = {
	id: string;
	nodeIds: string[];
};

export type CanvasDocument = {
	nodes: CanvasNode[];
	groups: CanvasGroup[];
};
