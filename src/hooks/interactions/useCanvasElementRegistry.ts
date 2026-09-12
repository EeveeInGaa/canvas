import { useCallback, useRef } from 'react';

export function useCanvasElementRegistry() {
	const nodeElementsRef = useRef(new Map<string, HTMLDivElement>());
	const groupElementsRef = useRef(new Map<string, HTMLDivElement>());

	const registerNodeElement = useCallback(
		(nodeId: string, element: HTMLDivElement | null) => {
			if (element) {
				nodeElementsRef.current.set(nodeId, element);
				return;
			}

			nodeElementsRef.current.delete(nodeId);
		},
		[],
	);

	const registerGroupElement = useCallback(
		(groupId: string, element: HTMLDivElement | null) => {
			if (element) {
				groupElementsRef.current.set(groupId, element);
				return;
			}

			groupElementsRef.current.delete(groupId);
		},
		[],
	);

	return {
		nodeElementsRef,
		groupElementsRef,
		registerNodeElement,
		registerGroupElement,
	};
}
