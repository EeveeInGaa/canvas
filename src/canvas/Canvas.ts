export type CanvasNodeType = 'text';

export type CanvasNode = {
	id: string;
	type: CanvasNodeType;
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
};

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

export type Viewport = {
	x: number;
	y: number;
	scale: number;
};
