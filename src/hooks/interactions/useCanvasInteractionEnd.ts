import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type SetStateAction,
	useCallback,
} from 'react';

import type { CanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import type { CanvasDocument } from '@/types/canvas-node.types';
import type { InteractionState } from '@/types/interaction.types';
import { applyDraggedNodePositions } from '@/utils/drag';

type UseCanvasInteractionEndParams = {
	interaction: InteractionState;
	dragPreview: CanvasDragPreview;
	commitDocument: Dispatch<SetStateAction<CanvasDocument>>;
	recordDocumentChange: (previousDocument: CanvasDocument) => void;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setDropTargetGroupId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasInteractionEnd({
	interaction,
	dragPreview,
	commitDocument,
	recordDocumentChange,
	setInteraction,
	setDropTargetGroupId,
}: UseCanvasInteractionEndParams) {
	const stopInteraction = useCallback(() => {
		const latestPositions = dragPreview.latestPositionsRef.current;

		if (interaction.type === 'dragging' && latestPositions) {
			commitDocument((canvasDocument) =>
				applyDraggedNodePositions(canvasDocument, interaction, latestPositions),
			);
		}

		if (interaction.type === 'resizing') {
			recordDocumentChange(interaction.startDocument);
		}

		dragPreview.clearPreview();
		setDropTargetGroupId(null);
		setInteraction({ type: 'idle' });
	}, [
		commitDocument,
		dragPreview.clearPreview,
		dragPreview.latestPositionsRef,
		interaction,
		recordDocumentChange,
		setDropTargetGroupId,
		setInteraction,
	]);

	return useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}

			stopInteraction();
		},
		[stopInteraction],
	);
}
