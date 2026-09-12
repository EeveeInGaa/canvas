import { ContextMenu } from '@base-ui/react/context-menu';

import {
	AddIcon,
	CaretRightIcon,
	CenterIcon,
	LinkIcon,
	SnapIcon,
	TextIcon,
} from '@/components/context-menu/CanvasMenuIcons';
import {
	MENU_ITEM_CLASS_NAME,
	MENU_LABEL_CLASS_NAME,
	MENU_POPUP_CLASS_NAME,
	MENU_POSITIONER_CLASS_NAME,
} from '@/components/context-menu/canvasMenuClassNames';
import styles from './CanvasContextMenu.module.css';

type CanvasWorkspaceMenuProps = {
	isSnapEnabled: boolean;
	onCenterViewport: () => void;
	onCreateLinkNode: () => void;
	onCreateTextNode: () => void;
	onToggleSnap: () => void;
};

export function CanvasWorkspaceMenu({
	isSnapEnabled,
	onCenterViewport,
	onCreateLinkNode,
	onCreateTextNode,
	onToggleSnap,
}: CanvasWorkspaceMenuProps) {
	return (
		<>
			<ContextMenu.Item
				className={MENU_ITEM_CLASS_NAME}
				onClick={onCenterViewport}
			>
				<CenterIcon />
				<span className={MENU_LABEL_CLASS_NAME}>Center canvas</span>
			</ContextMenu.Item>

			<ContextMenu.CheckboxItem
				checked={isSnapEnabled}
				className={MENU_ITEM_CLASS_NAME}
				closeOnClick
				onCheckedChange={onToggleSnap}
			>
				<SnapIcon />
				<span className={MENU_LABEL_CLASS_NAME}>Snap to grid</span>
				<ContextMenu.CheckboxItemIndicator className="size-3.5 [&_svg]:block [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.7] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]">
					<svg aria-hidden="true" viewBox="0 0 16 16">
						<path d="m3.5 8.25 2.75 2.75 6.25-6.25" />
					</svg>
				</ContextMenu.CheckboxItemIndicator>
			</ContextMenu.CheckboxItem>

			<ContextMenu.Separator className="mx-1 my-[5px] h-px bg-canvas-ink/10" />

			<ContextMenu.SubmenuRoot>
				<ContextMenu.SubmenuTrigger className={MENU_ITEM_CLASS_NAME}>
					<AddIcon />
					<span className={MENU_LABEL_CLASS_NAME}>Add node</span>
					<CaretRightIcon />
				</ContextMenu.SubmenuTrigger>
				<ContextMenu.Portal>
					<ContextMenu.Positioner
						alignOffset={-5}
						className={MENU_POSITIONER_CLASS_NAME}
						collisionPadding={8}
						sideOffset={-3}
					>
						<ContextMenu.Popup
							className={`${styles.popupMotion} ${MENU_POPUP_CLASS_NAME}`}
						>
							<ContextMenu.Item
								className={MENU_ITEM_CLASS_NAME}
								onClick={onCreateTextNode}
							>
								<TextIcon />
								<span className={MENU_LABEL_CLASS_NAME}>Text</span>
							</ContextMenu.Item>
							<ContextMenu.Item
								className={MENU_ITEM_CLASS_NAME}
								onClick={onCreateLinkNode}
							>
								<LinkIcon />
								<span className={MENU_LABEL_CLASS_NAME}>Link</span>
							</ContextMenu.Item>
						</ContextMenu.Popup>
					</ContextMenu.Positioner>
				</ContextMenu.Portal>
			</ContextMenu.SubmenuRoot>
		</>
	);
}
