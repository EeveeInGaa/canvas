import { type SetStateAction, useCallback } from 'react';

import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import type { CanvasDocument, CanvasNode } from '@/types/canvas-node.types';
import type { CanvasSpace } from '@/types/canvas-space.types';
import { canNodesFitCanvas, INFINITE_CANVAS_SPACE } from '@/utils/canvas-space';
import { sanitizeGroups } from '@/utils/document';

const INITIAL_CANVAS_DOCUMENT: CanvasDocument = {
	canvasSpace: INFINITE_CANVAS_SPACE,
	nodes: [],
	groups: [],
};

export function useCanvasDocument() {
	const {
		value: canvasDocument,
		commit: commitDocument,
		replace: replaceDocument,
		record: recordDocumentChange,
		undo,
		redo,
		canUndo,
		canRedo,
	} = useCanvasHistory(INITIAL_CANVAS_DOCUMENT);

	const commitNodes = useCallback(
		(value: SetStateAction<CanvasNode[]>) => {
			commitDocument((currentDocument) => {
				const nextNodes =
					typeof value === 'function' ? value(currentDocument.nodes) : value;

				return {
					...currentDocument,
					nodes: nextNodes,
					groups: sanitizeGroups(currentDocument.groups, nextNodes),
				};
			});
		},
		[commitDocument],
	);

	const replaceNodes = useCallback(
		(value: SetStateAction<CanvasNode[]>) => {
			replaceDocument((currentDocument) => {
				const nextNodes =
					typeof value === 'function' ? value(currentDocument.nodes) : value;

				return {
					...currentDocument,
					nodes: nextNodes,
					groups: sanitizeGroups(currentDocument.groups, nextNodes),
				};
			});
		},
		[replaceDocument],
	);
	const setCanvasSpace = useCallback(
		(canvasSpace: CanvasSpace) => {
			commitDocument((currentDocument) =>
				canNodesFitCanvas(currentDocument.nodes, canvasSpace)
					? { ...currentDocument, canvasSpace }
					: currentDocument,
			);
		},
		[commitDocument],
	);

	return {
		canvasDocument,
		canvasSpace: canvasDocument.canvasSpace,
		nodes: canvasDocument.nodes,
		groups: canvasDocument.groups,
		commitDocument,
		commitNodes,
		replaceNodes,
		setCanvasSpace,
		recordDocumentChange,
		undo,
		redo,
		canUndo,
		canRedo,
	};
}

export type CanvasDocumentController = ReturnType<typeof useCanvasDocument>;
