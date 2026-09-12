import { type SetStateAction, useCallback } from 'react';

import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import type { CanvasDocument, CanvasNode } from '@/types/canvas-node.types';
import { sanitizeGroups } from '@/utils/document';

const INITIAL_CANVAS_DOCUMENT: CanvasDocument = {
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
					nodes: nextNodes,
					groups: sanitizeGroups(currentDocument.groups, nextNodes),
				};
			});
		},
		[replaceDocument],
	);

	return {
		canvasDocument,
		nodes: canvasDocument.nodes,
		groups: canvasDocument.groups,
		commitDocument,
		commitNodes,
		replaceNodes,
		recordDocumentChange,
		undo,
		redo,
		canUndo,
		canRedo,
	};
}

export type CanvasDocumentController = ReturnType<typeof useCanvasDocument>;
