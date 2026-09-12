import type { ReactNode } from 'react';

import styles from './CanvasContextMenu.module.css';

function MenuIcon({ children }: { children: ReactNode }) {
	return (
		<span aria-hidden="true" className={styles.icon}>
			{children}
		</span>
	);
}

export function DuplicateIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<rect x="7" y="3.5" width="9.5" height="9.5" rx="2" />
				<path d="M13 13v1.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2H7" />
			</svg>
		</MenuIcon>
	);
}

export function GroupIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<rect x="3" y="3" width="5.5" height="5.5" rx="1.25" />
				<rect x="11.5" y="3" width="5.5" height="5.5" rx="1.25" />
				<rect x="3" y="11.5" width="5.5" height="5.5" rx="1.25" />
				<rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.25" />
			</svg>
		</MenuIcon>
	);
}

export function UngroupIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M8.25 3H5a2 2 0 0 0-2 2v3.25M11.75 3H15a2 2 0 0 1 2 2v3.25M17 11.75V15a2 2 0 0 1-2 2h-3.25M8.25 17H5a2 2 0 0 1-2-2v-3.25" />
				<path d="m7.5 7.5 5 5m0-5-5 5" />
			</svg>
		</MenuIcon>
	);
}

export function DeleteIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M3.5 5.5h13M8 3.5h4M5.5 5.5l.7 10a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-10M8 8.5v5.5m4-5.5v5.5" />
			</svg>
		</MenuIcon>
	);
}

export function CenterIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<circle cx="10" cy="10" r="3" />
				<path d="M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3" />
			</svg>
		</MenuIcon>
	);
}

export function SnapIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M5 3.5v8a5 5 0 0 0 10 0v-8M5 7h3M12 7h3" />
			</svg>
		</MenuIcon>
	);
}

export function AddIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M10 3.5v13M3.5 10h13" />
			</svg>
		</MenuIcon>
	);
}

export function TextIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M4 5V3.5h12V5M10 3.5v13M7.5 16.5h5" />
			</svg>
		</MenuIcon>
	);
}

export function LinkIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="m8 12 4-4M7 14.5l-1 1a3 3 0 0 1-4.25-4.25l2.5-2.5A3 3 0 0 1 8.5 8M13 5.5l1-1a3 3 0 1 1 4.25 4.25l-2.5 2.5A3 3 0 0 1 11.5 12" />
			</svg>
		</MenuIcon>
	);
}

export function CaretRightIcon() {
	return (
		<svg aria-hidden="true" className={styles.caret} viewBox="0 0 16 16">
			<path d="m6 3.5 4.5 4.5L6 12.5" />
		</svg>
	);
}
