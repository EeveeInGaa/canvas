import { useCallback, useEffect, useRef } from 'react';

import type { CanvasDocument } from '@/types/canvas-node.types';
import { areCanvasDocumentsEqual } from '@/utils/document';

type UseCanvasTextEditHistoryParams = {
	canvasDocument: CanvasDocument;
	editingNodeId: string | null;
	recordDocumentChange: (previousDocument: CanvasDocument) => void;
};

export function useCanvasTextEditHistory({
	canvasDocument,
	editingNodeId,
	recordDocumentChange,
}: UseCanvasTextEditHistoryParams) {
	const textEditStartDocumentRef = useRef<CanvasDocument | null>(null);
	const previousEditingNodeIdRef = useRef<string | null>(null);

	const commitPendingTextEdit = useCallback(() => {
		const textEditStartDocument = textEditStartDocumentRef.current;

		if (
			textEditStartDocument &&
			!areCanvasDocumentsEqual(textEditStartDocument, canvasDocument)
		) {
			recordDocumentChange(textEditStartDocument);
		}

		textEditStartDocumentRef.current = null;
	}, [canvasDocument, recordDocumentChange]);

	useEffect(() => {
		if (previousEditingNodeIdRef.current === editingNodeId) {
			return;
		}

		if (previousEditingNodeIdRef.current !== null) {
			commitPendingTextEdit();
		}

		textEditStartDocumentRef.current =
			editingNodeId !== null ? canvasDocument : null;
		previousEditingNodeIdRef.current = editingNodeId;
	}, [canvasDocument, commitPendingTextEdit, editingNodeId]);

	return { commitPendingTextEdit };
}
