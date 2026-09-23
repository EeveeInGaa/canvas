import { describe, expect, it } from 'vitest';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import { createGroupRectById, createNodeById } from '@/utils/group';
import {
	getEffectiveSelectedNodeIds,
	getSelectionInRect,
	mergeCanvasSelection,
} from '@/utils/selection';

const nodes: CanvasNode[] = [
	{
		id: 'ungrouped',
		isLocked: false,
		type: 'text',
		text: 'Ungrouped',
		x: 10,
		y: 10,
		width: 20,
		height: 20,
	},
	{
		id: 'grouped',
		isLocked: false,
		type: 'text',
		text: 'Grouped',
		x: 100,
		y: 100,
		width: 100,
		height: 100,
	},
];

const groups: CanvasGroup[] = [
	{ id: 'group', isLocked: false, nodeIds: ['grouped'] },
];
const groupRectById = createGroupRectById(groups, createNodeById(nodes));

describe('getSelectionInRect', () => {
	it('selects an ungrouped node when the selection partially overlaps it', () => {
		expect(
			getSelectionInRect(
				{ x: 25, y: 25, width: 10, height: 10 },
				groups,
				nodes,
				groupRectById,
			),
		).toEqual({ nodeIds: ['ungrouped'], groupIds: [] });
	});

	it('does not select nodes outside the selection', () => {
		expect(
			getSelectionInRect(
				{ x: 40, y: 40, width: 10, height: 10 },
				groups,
				nodes,
				groupRectById,
			),
		).toEqual({ nodeIds: [], groupIds: [] });
	});

	it('selects a group by its frame without returning its nodes separately', () => {
		expect(
			getSelectionInRect(
				{ x: 70, y: 70, width: 20, height: 20 },
				groups,
				nodes,
				groupRectById,
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

describe('mergeCanvasSelection', () => {
	it('adds rectangle matches to the starting selection', () => {
		expect(
			mergeCanvasSelection(
				groups,
				{ nodeIds: ['ungrouped'], groupIds: [] },
				{ nodeIds: [], groupIds: ['group'] },
				'add',
			),
		).toEqual({ nodeIds: ['ungrouped'], groupIds: ['group'] });
	});

	it('toggles direct nodes and groups from the starting selection', () => {
		expect(
			mergeCanvasSelection(
				groups,
				{ nodeIds: ['ungrouped'], groupIds: ['group'] },
				{ nodeIds: ['ungrouped'], groupIds: ['group'] },
				'toggle',
			),
		).toEqual({ nodeIds: [], groupIds: [] });
	});

	it('removes direct node duplicates covered by a selected group', () => {
		expect(
			mergeCanvasSelection(
				groups,
				{ nodeIds: ['grouped'], groupIds: [] },
				{ nodeIds: [], groupIds: ['group'] },
				'add',
			),
		).toEqual({ nodeIds: [], groupIds: ['group'] });
	});
});
