import type { CanvasNode } from '@/canvas/types/canvas-node.types';

export type ResizeHandle = 'bottom-right';

export type InteractionState =
	| { type: 'idle' }
	| {
			type: 'dragging';
			nodeIds: string[];
			startPointerX: number;
			startPointerY: number;
			startNodePositions: Array<{
				nodeId: string;
				x: number;
				y: number;
			}>;
	  }
	| {
			type: 'resizing';
			nodeId: string;
			handle: ResizeHandle;
			startPointerX: number;
			startPointerY: number;
			startWidth: number;
			startHeight: number;
			startNodes: CanvasNode[];
	  }
	| {
			type: 'panning';
			startPointerX: number;
			startPointerY: number;
			startViewportX: number;
			startViewportY: number;
	  }
	| {
			type: 'selecting';
			startX: number;
			startY: number;
			currentX: number;
			currentY: number;
	  };
