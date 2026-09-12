import { CanvasControlsPopover } from '@/components/toolbar/CanvasControlsPopover';
import { CanvasToolbarButton } from '@/components/toolbar/CanvasToolbarButton';

type CanvasToolbarProps = {
	canRedo: boolean;
	canUndo: boolean;
	isDebugEnabled: boolean;
	isInfoOpen: boolean;
	isSnapEnabled: boolean;
	onCenterViewport: () => void;
	onRedo: () => void;
	onToggleDebug: () => void;
	onInfoOpenChange: (isOpen: boolean) => void;
	onToggleSnap: () => void;
	onUndo: () => void;
	onCreateTextNode: () => void;
	onCreateLinkNode: () => void;
};

export function CanvasToolbar({
	canRedo,
	canUndo,
	isDebugEnabled,
	isInfoOpen,
	isSnapEnabled,
	onCenterViewport,
	onRedo,
	onToggleDebug,
	onInfoOpenChange,
	onToggleSnap,
	onUndo,
	onCreateTextNode,
	onCreateLinkNode,
}: CanvasToolbarProps) {
	return (
		<>
			<div
				style={{
					position: 'absolute',
					top: 12,
					right: 12,
					zIndex: 10,
					display: 'flex',
					gap: 8,
				}}
			>
				<CanvasToolbarButton onClick={onCenterViewport}>
					Center
				</CanvasToolbarButton>
				<CanvasToolbarButton disabled={!canUndo} onClick={onUndo}>
					Undo
				</CanvasToolbarButton>
				<CanvasToolbarButton disabled={!canRedo} onClick={onRedo}>
					Redo
				</CanvasToolbarButton>
				<CanvasToolbarButton isPressed={isDebugEnabled} onClick={onToggleDebug}>
					Debug: {isDebugEnabled ? 'On' : 'Off'}
				</CanvasToolbarButton>
				<CanvasToolbarButton isPressed={isSnapEnabled} onClick={onToggleSnap}>
					Snap: {isSnapEnabled ? 'On' : 'Off'}
				</CanvasToolbarButton>
				<CanvasControlsPopover
					isOpen={isInfoOpen}
					onOpenChange={onInfoOpenChange}
				/>
			</div>

			<div
				style={{
					position: 'absolute',
					top: 12,
					left: 12,
					zIndex: 10,
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
				}}
			>
				<CanvasToolbarButton onClick={onCreateTextNode}>
					Text
				</CanvasToolbarButton>
				<CanvasToolbarButton onClick={onCreateLinkNode}>
					Link
				</CanvasToolbarButton>
			</div>
		</>
	);
}
