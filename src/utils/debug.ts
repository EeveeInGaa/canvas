import type { CanvasDebugStats } from '@/types/canvas-debug.types';
import { type CanvasNode, CanvasNodeType } from '@/types/canvas-node.types';
import type { Rect } from '@/types/geometry.types';
import { doRectsIntersect } from '@/utils/geometry';

type GetCanvasDebugStatsParams = {
	nodes: CanvasNode[];
	renderedNodes: CanvasNode[];
	viewportRect: Rect;
	renderingRect: Rect;
	totalGroupCount: number;
	selectedNodeCount: number;
	selectedGroupCount: number;
	affectedNodeCount: number;
};

export function getCanvasDebugStats({
	nodes,
	renderedNodes,
	viewportRect,
	renderingRect,
	totalGroupCount,
	selectedNodeCount,
	selectedGroupCount,
	affectedNodeCount,
}: GetCanvasDebugStatsParams): CanvasDebugStats {
	const nodeTypeCounts: Record<CanvasNodeType, number> = {
		[CanvasNodeType.Text]: 0,
		[CanvasNodeType.Link]: 0,
	};

	for (const node of nodes) {
		nodeTypeCounts[node.type] += 1;
	}

	let visibleNodeCount = 0;
	let overscanNodeCount = 0;
	let retainedOffscreenNodeCount = 0;

	for (const node of renderedNodes) {
		if (doRectsIntersect(node, viewportRect)) {
			visibleNodeCount += 1;
		} else if (doRectsIntersect(node, renderingRect)) {
			overscanNodeCount += 1;
		} else {
			retainedOffscreenNodeCount += 1;
		}
	}

	return {
		totalNodeCount: nodes.length,
		totalGroupCount,
		nodeTypeCounts,
		selectionTargetCount: selectedNodeCount + selectedGroupCount,
		selectedNodeCount,
		selectedGroupCount,
		affectedNodeCount,
		visibleNodeCount,
		hiddenNodeCount: nodes.length - visibleNodeCount,
		mountedNodeCount: renderedNodes.length,
		culledNodeCount: nodes.length - renderedNodes.length,
		overscanNodeCount,
		retainedOffscreenNodeCount,
	};
}
