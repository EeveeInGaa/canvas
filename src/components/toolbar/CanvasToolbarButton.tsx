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
		? 'cursor-not-allowed border-control-border-disabled border-dashed bg-panel text-canvas-muted'
		: isPressed
			? 'cursor-pointer border-control-border-selected bg-accent text-accent-contrast shadow-[inset_0_0_0_1px_var(--canvas-accent-contrast)]'
			: 'cursor-pointer border-control-border bg-panel text-canvas-ink/[0.82] hover:border-control-border-hover hover:bg-panel-hover hover:text-accent-text active:scale-[0.97]';

	return (
		<button
			aria-pressed={isPressed}
			className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-[background-color,border-color,color,transform] duration-[120ms] ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none ${stateClassName}`}
			type="button"
			disabled={disabled}
			onPointerDown={(event) => event.stopPropagation()}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
