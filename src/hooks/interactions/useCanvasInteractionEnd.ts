import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
	useCallback,
} from 'react';

import type { CanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import type { CanvasDocument, CanvasNode } from '@/types/canvas-node.types';
import type { InteractionState } from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { areCanvasDocumentsEqual } from '@/utils/document';
import { applyDraggedNodePositions } from '@/utils/drag';

type UseCanvasInteractionEndParams = {
	canvasDocument: CanvasDocument;
	interaction: InteractionState;
	dragPreview: CanvasDragPreview;
	pointerCaptureTargetRef: RefObject<HTMLDivElement | null>;
	commitDocument: Dispatch<SetStateAction<CanvasDocument>>;
	recordDocumentChange: (previousDocument: CanvasDocument) => void;
	setNodes: Dispatch<SetStateAction<CanvasNode[]>>;
	setViewport: Dispatch<SetStateAction<Viewport>>;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	setSelectedGroupIds: Dispatch<SetStateAction<string[]>>;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setDropTargetGroupId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasInteractionEnd({
	canvasDocument,
	interaction,
	dragPreview,
	pointerCaptureTargetRef,
	commitDocument,
	recordDocumentChange,
	setNodes,
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

			if (
				interaction.type === 'resizing' &&
				!areCanvasDocumentsEqual(interaction.startDocument, canvasDocument)
			) {
				recordDocumentChange(interaction.startDocument);
			}

			resetInteraction();
		},
		[
			canvasDocument,
			commitDocument,
			dragPreview.latestPositionsRef,
			interaction,
			recordDocumentChange,
			releasePointerCapture,
			resetInteraction,
		],
	);

	const handlePointerCancel = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			releasePointerCapture(event.pointerId);

			if (interaction.type === 'resizing') {
				setNodes(interaction.startDocument.nodes);
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
			setNodes,
			setSelectedGroupIds,
			setSelectedNodeIds,
			setViewport,
		],
	);

	return { handlePointerUp, handlePointerCancel };
}
