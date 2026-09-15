import { ContextMenu } from '@base-ui/react/context-menu';
import { Lock, LockOpen } from 'lucide-react';
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
	isSelectionLocked: boolean;
	selectionCount: number;
	onDelete: () => void;
	onDuplicate: () => void;
	onGroup: () => void;
	onToggleLock: () => void;
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
	isSelectionLocked,
	selectionCount,
	onDelete,
	onDuplicate,
	onGroup,
	onToggleLock,
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

			<ContextMenu.Item className={MENU_ITEM_CLASS_NAME} onClick={onToggleLock}>
				{isSelectionLocked ? (
					<LockOpen
						aria-hidden="true"
						className="size-4 text-canvas-ink/[0.58]"
						strokeWidth={1.45}
					/>
				) : (
					<Lock
						aria-hidden="true"
						className="size-4 text-canvas-ink/[0.58]"
						strokeWidth={1.45}
					/>
				)}
				<span className={MENU_LABEL_CLASS_NAME}>
					{isSelectionLocked ? 'Unlock selection' : 'Lock selection'}
				</span>
				<Shortcut>⇧ Ctrl/⌘ L</Shortcut>
			</ContextMenu.Item>

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
