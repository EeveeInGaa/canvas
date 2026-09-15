import { describe, expect, it } from 'vitest';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import { getLockedNodeIdSet } from '@/utils/lock';

const nodes: CanvasNode[] = [
	{
		id: 'locked-node',
		isLocked: true,
		type: 'text',
		text: 'Locked',
		x: 0,
		y: 0,
		width: 100,
		height: 100,
	},
	{
		id: 'grouped-node',
		isLocked: false,
		type: 'text',
		text: 'Grouped',
		x: 120,
		y: 0,
		width: 100,
		height: 100,
	},
	{
		id: 'unlocked-node',
		isLocked: false,
		type: 'text',
		text: 'Unlocked',
		x: 240,
		y: 0,
		width: 100,
		height: 100,
	},
];

const groups: CanvasGroup[] = [
	{
		id: 'locked-group',
		isLocked: true,
		nodeIds: ['grouped-node'],
	},
];

describe('getLockedNodeIdSet', () => {
	it('includes directly locked nodes and members of locked groups', () => {
		expect([...getLockedNodeIdSet(nodes, groups)]).toEqual([
			'locked-node',
			'grouped-node',
		]);
	});
});
