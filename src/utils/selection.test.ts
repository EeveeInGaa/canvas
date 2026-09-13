import { describe, expect, it } from 'vitest';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import {
	getEffectiveSelectedNodeIds,
	getSelectionInRect,
} from '@/utils/selection';

const nodes: CanvasNode[] = [
	{
		id: 'ungrouped',
		type: 'text',
		text: 'Ungrouped',
		x: 10,
		y: 10,
		width: 20,
		height: 20,
	},
	{
		id: 'grouped',
		type: 'text',
		text: 'Grouped',
		x: 100,
		y: 100,
		width: 100,
		height: 100,
	},
];

const groups: CanvasGroup[] = [{ id: 'group', nodeIds: ['grouped'] }];

describe('getSelectionInRect', () => {
	it('selects an ungrouped node when the selection partially overlaps it', () => {
		expect(
			getSelectionInRect(
				{ x: 25, y: 25, width: 10, height: 10 },
				groups,
				nodes,
			),
		).toEqual({ nodeIds: ['ungrouped'], groupIds: [] });
	});

	it('does not select nodes outside the selection', () => {
		expect(
			getSelectionInRect(
				{ x: 40, y: 40, width: 10, height: 10 },
				groups,
				nodes,
			),
		).toEqual({ nodeIds: [], groupIds: [] });
	});

	it('selects a group by its frame without returning its nodes separately', () => {
		expect(
			getSelectionInRect(
				{ x: 70, y: 70, width: 20, height: 20 },
				groups,
				nodes,
			),
		).toEqual({ nodeIds: [], groupIds: ['group'] });
	});
});

describe('getEffectiveSelectedNodeIds', () => {
	it('combines individual and grouped nodes without duplicates', () => {
		expect(
			getEffectiveSelectedNodeIds(groups, ['ungrouped', 'grouped'], ['group']),
		).toEqual(['ungrouped', 'grouped']);
	});
});
