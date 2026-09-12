import type { Rect } from '@/types/geometry.types.ts';

export const CanvasNodeType = {
	Text: 'text',
	Link: 'link',
} as const;

export type CanvasNodeType =
	(typeof CanvasNodeType)[keyof typeof CanvasNodeType];

type BaseCanvasNode = Rect & {
	id: string;
};

export type TextCanvasNode = BaseCanvasNode & {
	type: typeof CanvasNodeType.Text;
	text: string;
};

export type LinkCanvasNode = BaseCanvasNode & {
	type: typeof CanvasNodeType.Link;
	url: string;
	label: string;
};

export type LinkNodeChanges = Partial<Pick<LinkCanvasNode, 'label' | 'url'>>;

export type CanvasNode = TextCanvasNode | LinkCanvasNode;

export type CanvasGroup = {
	id: string;
	nodeIds: string[];
};

export type CanvasDocument = {
	nodes: CanvasNode[];
	groups: CanvasGroup[];
};
