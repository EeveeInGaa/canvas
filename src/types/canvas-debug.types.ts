import type { CanvasNodeType } from '@/types/canvas-node.types';

export type CanvasDebugStats = {
	totalNodeCount: number;
	totalGroupCount: number;
	nodeTypeCounts: Record<CanvasNodeType, number>;
	selectionTargetCount: number;
	selectedNodeCount: number;
	selectedGroupCount: number;
	affectedNodeCount: number;
	visibleNodeCount: number;
	hiddenNodeCount: number;
	mountedNodeCount: number;
	culledNodeCount: number;
	overscanNodeCount: number;
	retainedOffscreenNodeCount: number;
};

export type CanvasFrameMetrics = {
	frameTimeP95Ms: number | null;
	slowFramePercentage: number | null;
};
