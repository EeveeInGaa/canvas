import { ContextMenu } from '@base-ui/react/context-menu';

import { CanvasSelectionMenu } from '@/components/context-menu/CanvasSelectionMenu';
import { CanvasWorkspaceMenu } from '@/components/context-menu/CanvasWorkspaceMenu';
import {
	MENU_POPUP_CLASS_NAME,
	MENU_POSITIONER_CLASS_NAME,
} from '@/components/context-menu/canvasMenuClassNames';
import styles from './CanvasContextMenu.module.css';

type CanvasContextMenuProps = {
	canGroup: boolean;
	canUngroup: boolean;
	isSelectionMenu: boolean;
	isSnapEnabled: boolean;
	selectionCount: number;
	onCenterViewport: () => void;
	onCreateLinkNode: () => void;
	onCreateTextNode: () => void;
	onDelete: () => void;
	onDuplicate: () => void;
	onGroup: () => void;
	onToggleSnap: () => void;
	onUngroup: () => void;
};

export function CanvasContextMenu({
	canGroup,
	canUngroup,
	isSelectionMenu,
	isSnapEnabled,
	selectionCount,
	onCenterViewport,
	onCreateLinkNode,
	onCreateTextNode,
	onDelete,
	onDuplicate,
	onGroup,
	onToggleSnap,
	onUngroup,
}: CanvasContextMenuProps) {
	return (
		<ContextMenu.Portal>
			<ContextMenu.Positioner
				className={MENU_POSITIONER_CLASS_NAME}
				collisionPadding={8}
			>
				<ContextMenu.Popup
					className={`${styles.popupMotion} ${MENU_POPUP_CLASS_NAME}`}
				>
					{isSelectionMenu ? (
						<CanvasSelectionMenu
							canGroup={canGroup}
							canUngroup={canUngroup}
							onDelete={onDelete}
							onDuplicate={onDuplicate}
							onGroup={onGroup}
							onUngroup={onUngroup}
							selectionCount={selectionCount}
						/>
					) : (
						<CanvasWorkspaceMenu
							isSnapEnabled={isSnapEnabled}
							onCenterViewport={onCenterViewport}
							onCreateLinkNode={onCreateLinkNode}
							onCreateTextNode={onCreateTextNode}
							onToggleSnap={onToggleSnap}
						/>
					)}
				</ContextMenu.Popup>
			</ContextMenu.Positioner>
		</ContextMenu.Portal>
	);
}
