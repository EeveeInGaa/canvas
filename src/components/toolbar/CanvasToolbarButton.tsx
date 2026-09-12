import type { ReactNode } from 'react';

type CanvasToolbarButtonProps = {
	children: ReactNode;
	disabled?: boolean;
	isPressed?: boolean;
	onClick: () => void;
};

export function CanvasToolbarButton({
	children,
	disabled = false,
	isPressed,
	onClick,
}: CanvasToolbarButtonProps) {
	const stateClassName = disabled
		? 'cursor-not-allowed bg-panel text-canvas-ink/[0.32]'
		: isPressed
			? 'cursor-pointer bg-accent text-accent-contrast'
			: 'cursor-pointer bg-panel text-canvas-ink/[0.82]';

	return (
		<button
			aria-pressed={isPressed}
			className={`rounded-full border border-canvas-ink/[0.14] px-2.5 py-1.5 text-xs font-semibold ${stateClassName}`}
			type="button"
			disabled={disabled}
			onPointerDown={(event) => event.stopPropagation()}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
