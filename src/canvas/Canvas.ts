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
          nodeId: string;
          startPointerX: number;
          startPointerY: number;
          startNodeX: number;
          startNodeY: number;
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
      };

export type Viewport = {
    x: number;
    y: number;
    scale: number;
};