import { CanvasControlsPopover } from '@/components/toolbar/CanvasControlsPopover';
import { CanvasToolbarButton } from '@/components/toolbar/CanvasToolbarButton';
import { CanvasZoomPopover } from '@/components/toolbar/CanvasZoomPopover';

type CanvasToolbarProps = {
	canRedo: boolean;
	canUndo: boolean;
	isDebugEnabled: boolean;
	isInfoOpen: boolean;
	isSnapEnabled: boolean;
	zoom: number;
	onCenterViewport: () => void;
	onZoomChange: (zoom: number) => void;
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
	zoom,
	onCenterViewport,
	onZoomChange,
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
			<div className="absolute top-3 right-3 z-10 flex gap-2">
				<CanvasZoomPopover zoom={zoom} onZoomChange={onZoomChange} />
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

			<div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
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
