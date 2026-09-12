import { ContextMenu } from '@base-ui/react/context-menu';
import type { ReactNode } from 'react';

import {
	DeleteIcon,
	DuplicateIcon,
	GroupIcon,
	UngroupIcon,
} from '@/components/context-menu/CanvasMenuIcons';
import {
	DESTRUCTIVE_MENU_ITEM_CLASS_NAME,
	MENU_ITEM_CLASS_NAME,
	MENU_LABEL_CLASS_NAME,
} from '@/components/context-menu/canvasMenuClassNames';

type CanvasSelectionMenuProps = {
	canGroup: boolean;
	canUngroup: boolean;
	selectionCount: number;
	onDelete: () => void;
	onDuplicate: () => void;
	onGroup: () => void;
	onUngroup: () => void;
};

function Shortcut({ children }: { children: ReactNode }) {
	return (
		<span className="whitespace-nowrap text-[10px] font-medium tracking-[0.01em] text-canvas-muted">
			{children}
		</span>
	);
}

export function CanvasSelectionMenu({
	canGroup,
	canUngroup,
	selectionCount,
	onDelete,
	onDuplicate,
	onGroup,
	onUngroup,
}: CanvasSelectionMenuProps) {
	return (
		<>
			<ContextMenu.Item className={MENU_ITEM_CLASS_NAME} onClick={onDuplicate}>
				<DuplicateIcon />
				<span className={MENU_LABEL_CLASS_NAME}>Duplicate</span>
				<Shortcut>Ctrl/⌘ D</Shortcut>
			</ContextMenu.Item>

			{canGroup && (
				<ContextMenu.Item className={MENU_ITEM_CLASS_NAME} onClick={onGroup}>
					<GroupIcon />
					<span className={MENU_LABEL_CLASS_NAME}>Group selection</span>
					<Shortcut>Ctrl/⌘ G</Shortcut>
				</ContextMenu.Item>
			)}

			{canUngroup && (
				<ContextMenu.Item className={MENU_ITEM_CLASS_NAME} onClick={onUngroup}>
					<UngroupIcon />
					<span className={MENU_LABEL_CLASS_NAME}>Ungroup</span>
					<Shortcut>⇧ Ctrl/⌘ G</Shortcut>
				</ContextMenu.Item>
			)}

			<ContextMenu.Separator className="mx-1 my-[5px] h-px bg-canvas-ink/10" />

			<ContextMenu.Item
				className={DESTRUCTIVE_MENU_ITEM_CLASS_NAME}
				onClick={onDelete}
			>
				<DeleteIcon />
				<span className={MENU_LABEL_CLASS_NAME}>
					{selectionCount > 1 ? `Delete ${selectionCount} items` : 'Delete'}
				</span>
				<Shortcut>⌫</Shortcut>
			</ContextMenu.Item>
		</>
	);
}
