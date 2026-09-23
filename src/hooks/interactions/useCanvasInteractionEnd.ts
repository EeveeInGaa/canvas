import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
	useCallback,
} from 'react';

import type { CanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import type { CanvasResizePreview } from '@/hooks/interactions/useCanvasResizePreview';
import type { CanvasDocument } from '@/types/canvas-node.types';
import type { InteractionState } from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { applyDraggedNodePositions } from '@/utils/drag';
import { resizeNode } from '@/utils/node';

type UseCanvasInteractionEndParams = {
	interaction: InteractionState;
	dragPreview: CanvasDragPreview;
	resizePreview: CanvasResizePreview;
	pointerCaptureTargetRef: RefObject<HTMLDivElement | null>;
	commitDocument: Dispatch<SetStateAction<CanvasDocument>>;
	setViewport: Dispatch<SetStateAction<Viewport>>;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	setSelectedGroupIds: Dispatch<SetStateAction<string[]>>;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setDropTargetGroupId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasInteractionEnd({
	interaction,
	dragPreview,
	resizePreview,
	pointerCaptureTargetRef,
	commitDocument,
	setViewport,
	setSelectedNodeIds,
	setSelectedGroupIds,
	setInteraction,
	setDropTargetGroupId,
}: UseCanvasInteractionEndParams) {
	const releasePointerCapture = useCallback(
		(pointerId: number) => {
			const captureTarget = pointerCaptureTargetRef.current;

			if (captureTarget?.hasPointerCapture(pointerId)) {
				captureTarget.releasePointerCapture(pointerId);
			}

			pointerCaptureTargetRef.current = null;
		},
		[pointerCaptureTargetRef],
	);

	const resetInteraction = useCallback(() => {
		dragPreview.clearPreview();
		setDropTargetGroupId(null);
		setInteraction({ type: 'idle' });
	}, [dragPreview.clearPreview, setDropTargetGroupId, setInteraction]);

	const handlePointerUp = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			releasePointerCapture(event.pointerId);

			const latestPositions = dragPreview.latestPositionsRef.current;

			if (interaction.type === 'dragging' && latestPositions) {
				commitDocument((currentDocument) =>
					applyDraggedNodePositions(
						currentDocument,
						interaction,
						latestPositions,
					),
				);
			}

			if (interaction.type === 'resizing') {
				const latestSize = resizePreview.latestSizeRef.current;

				if (
					latestSize &&
					(latestSize.width !== interaction.startWidth ||
						latestSize.height !== interaction.startHeight)
				) {
					commitDocument((currentDocument) => {
						const nextNodes = resizeNode(
							currentDocument.nodes,
							interaction.nodeId,
							latestSize,
						);

						return Object.is(nextNodes, currentDocument.nodes)
							? currentDocument
							: { ...currentDocument, nodes: nextNodes };
					});
					resizePreview.completePreview();
				} else {
					resizePreview.clearPreview();
				}
			}

			resetInteraction();
		},
		[
			commitDocument,
			dragPreview.latestPositionsRef,
			interaction,
			releasePointerCapture,
			resizePreview.clearPreview,
			resizePreview.completePreview,
			resizePreview.latestSizeRef,
			resetInteraction,
		],
	);

	const handlePointerCancel = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			releasePointerCapture(event.pointerId);

			if (interaction.type === 'resizing') {
				resizePreview.clearPreview();
			} else if (interaction.type === 'panning') {
				setViewport((currentViewport) => ({
					...currentViewport,
					x: interaction.startViewportX,
					y: interaction.startViewportY,
				}));
			} else if (interaction.type === 'selecting') {
				setSelectedNodeIds(interaction.startSelectedNodeIds);
				setSelectedGroupIds(interaction.startSelectedGroupIds);
			}

			resetInteraction();
		},
		[
			interaction,
			releasePointerCapture,
			resetInteraction,
			resizePreview.clearPreview,
			setSelectedGroupIds,
			setSelectedNodeIds,
			setViewport,
		],
	);

	return { handlePointerUp, handlePointerCancel };
}
