import type * as React from 'react';

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
}
export function Button({ children, onClick, ...props }: ButtonProps) {
	return (
		<button
			className="block rounded-sm border border-text px-4 py-2 cursor-pointer hover:bg-secondary"
			onClick={onClick}
			{...props}
		>
			{children}
		</button>
	);
}
