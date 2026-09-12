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
	return (
		<button
			aria-pressed={isPressed}
			type="button"
			disabled={disabled}
			onPointerDown={(event) => event.stopPropagation()}
			onClick={onClick}
			style={{
				border: '1px solid rgba(255,255,255,0.14)',
				borderRadius: 999,
				background: isPressed ? '#7c9cff' : '#1b1d24',
				color: disabled
					? 'rgba(255,255,255,0.32)'
					: isPressed
						? '#101217'
						: 'rgba(255,255,255,0.82)',
				padding: '6px 10px',
				fontSize: 12,
				fontWeight: 600,
				cursor: disabled ? 'not-allowed' : 'pointer',
			}}
		>
			{children}
		</button>
	);
}
