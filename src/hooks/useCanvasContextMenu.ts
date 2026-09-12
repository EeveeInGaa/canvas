import {
	type MouseEvent,
	type RefObject,
	useCallback,
	useRef,
	useState,
} from 'react';

import type { CanvasCommands } from '@/hooks/useCanvasCommands';
import type { CanvasSelectionController } from '@/hooks/useCanvasSelection';
import { CanvasNodeType } from '@/types/canvas-node.types';
import type { Point } from '@/types/geometry.types';
import type { Viewport } from '@/types/viewport.types';
import { screenToCanvas } from '@/utils/coordinates';

type UseCanvasContextMenuParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
	viewport: Viewport;
	commands: CanvasCommands;
	selectionController: CanvasSelectionController;
};

export function useCanvasContextMenu({
	canvasRef,
	viewport,
	commands,
	selectionController,
}: UseCanvasContextMenuParams) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSelectionMenu, setIsSelectionMenu] = useState(false);
	const canvasPositionRef = useRef<Point | null>(null);
	const {
		effectiveSelectedNodeIdSet,
		selectedGroupIdSet,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setEditingNodeId,
	} = selectionController;

	const deleteSelection = useCallback(() => {
		commands.deleteSelectedNodes();
		setIsOpen(false);
	}, [commands.deleteSelectedNodes]);

	const duplicateSelection = useCallback(() => {
		commands.duplicateSelectedNodes();
		setIsOpen(false);
	}, [commands.duplicateSelectedNodes]);

	const createNodeAtMenuPosition = useCallback(
		(type: CanvasNodeType) => {
			const position = canvasPositionRef.current;

			if (position) {
				commands.createNodeAtPosition(type, position);
				return;
			}

			commands.createNodeAtCanvasCenter(type);
		},
		[commands.createNodeAtCanvasCenter, commands.createNodeAtPosition],
	);

	const createTextNode = useCallback(() => {
		createNodeAtMenuPosition(CanvasNodeType.Text);
	}, [createNodeAtMenuPosition]);

	const createLinkNode = useCallback(() => {
		createNodeAtMenuPosition(CanvasNodeType.Link);
	}, [createNodeAtMenuPosition]);

	const handleContextMenu = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			const eventTarget = event.target;
			const targetElement =
				eventTarget instanceof Element ? eventTarget : event.currentTarget;
			const nodeElement = targetElement.closest<HTMLElement>('[data-node-id]');
			const groupElement =
				targetElement.closest<HTMLElement>('[data-group-id]');

			if (nodeElement?.dataset.nodeId) {
				const nodeId = nodeElement.dataset.nodeId;

				if (!effectiveSelectedNodeIdSet.has(nodeId)) {
					setSelectedNodeIds([nodeId]);
					setSelectedGroupIds([]);
				}

				setEditingNodeId(null);
				setIsSelectionMenu(true);
				return;
			}

			if (groupElement?.dataset.groupId) {
				const groupId = groupElement.dataset.groupId;

				if (!selectedGroupIdSet.has(groupId)) {
					setSelectedNodeIds([]);
					setSelectedGroupIds([groupId]);
				}

				setEditingNodeId(null);
				setIsSelectionMenu(true);
				return;
			}

			const canvasElement = canvasRef.current;

			if (canvasElement) {
				canvasPositionRef.current = screenToCanvas({
					screenX: event.clientX,
					screenY: event.clientY,
					canvasRect: canvasElement.getBoundingClientRect(),
					viewport,
				});
			}

			setEditingNodeId(null);
			setIsSelectionMenu(false);
		},
		[
			canvasRef,
			effectiveSelectedNodeIdSet,
			selectedGroupIdSet,
			setEditingNodeId,
			setSelectedGroupIds,
			setSelectedNodeIds,
			viewport,
		],
	);

	return {
		isOpen,
		isSelectionMenu,
		setIsOpen,
		deleteSelection,
		duplicateSelection,
		createTextNode,
		createLinkNode,
		handleContextMenu,
	};
}
