export type CanvasShortcut = {
	action: string;
	keys: readonly string[];
};

export type CanvasShortcutSection = {
	title: string;
	value: string;
	shortcuts: readonly CanvasShortcut[];
};

export const CANVAS_SHORTCUT_SECTIONS: readonly CanvasShortcutSection[] = [
	{
		title: 'Canvas',
		value: 'canvas',
		shortcuts: [
			{ action: 'Add text node', keys: ['T'] },
			{ action: 'Add link node', keys: ['L'] },
			{ action: 'Toggle snap', keys: ['S'] },
			{ action: 'Center canvas', keys: ['C'] },
			{ action: 'Toggle debug', keys: ['D'] },
			{ action: 'Toggle this menu', keys: ['I'] },
		],
	},
	{
		title: 'Navigate',
		value: 'navigate',
		shortcuts: [
			{ action: 'Pan canvas', keys: ['Space', 'Drag'] },
			{ action: 'Pan canvas', keys: ['Scroll'] },
			{ action: 'Zoom in/out', keys: ['Ctrl / ⌘', '+ / -'] },
			{ action: 'Zoom', keys: ['Ctrl / ⌘', 'Scroll'] },
			{ action: 'Zoom', keys: ['Pinch'] },
			{ action: 'Actions', keys: ['Right click'] },
		],
	},
	{
		title: 'Edit selection',
		value: 'selection',
		shortcuts: [
			{ action: 'Move selection', keys: ['Arrow keys'] },
			{ action: 'Move farther', keys: ['Shift', 'Arrow keys'] },
			{ action: 'Duplicate', keys: ['Ctrl / ⌘', 'D'] },
			{ action: 'Delete', keys: ['Backspace / Del'] },
			{ action: 'Group', keys: ['Ctrl / ⌘', 'G'] },
			{ action: 'Ungroup', keys: ['Ctrl / ⌘', 'Shift', 'G'] },
			{ action: 'Lock / unlock', keys: ['Ctrl / ⌘', 'Shift', 'L'] },
			{ action: 'Undo', keys: ['Ctrl / ⌘', 'Z'] },
			{ action: 'Redo', keys: ['Ctrl / ⌘', 'Shift', 'Z'] },
		],
	},
];
