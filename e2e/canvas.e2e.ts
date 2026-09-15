import { expect, type Locator, type Page, test } from '@playwright/test';

const nodeSelector = '[data-node-id]';
const selectedNodeSelector = `${nodeSelector}[data-selected="true"]`;

async function createTextNode(page: Page, text: string): Promise<Locator> {
	const nodes = page.locator(nodeSelector);
	const previousCount = await nodes.count();

	await page.getByRole('button', { name: 'Text', exact: true }).click();

	const node = nodes.nth(previousCount);
	const editor = node.locator('textarea');

	await expect(editor).toBeFocused();
	await editor.fill(text);
	await editor.press('Escape');
	await expect(node).toContainText(text);

	return node;
}

async function pressKey(page: Page, key: string, count: number) {
	for (let index = 0; index < count; index += 1) {
		await page.keyboard.press(key);
	}
}

async function getNodeCenter(node: Locator) {
	return node.evaluate((element) => ({
		x:
			Number.parseFloat((element as HTMLElement).style.left) +
			Number.parseFloat((element as HTMLElement).style.width) / 2,
		y:
			Number.parseFloat((element as HTMLElement).style.top) +
			Number.parseFloat((element as HTMLElement).style.height) / 2,
	}));
}

async function createSeparatedNodes(page: Page) {
	await createTextNode(page, 'Left node');
	await pressKey(page, 'Shift+ArrowLeft', 6);

	await createTextNode(page, 'Right node');
	await pressKey(page, 'Shift+ArrowRight', 6);
}

async function dragWithinCanvas(
	page: Page,
	start: { x: number; y: number },
	end: { x: number; y: number },
) {
	const canvas = page.getByRole('application', { name: 'Canvas workspace' });
	const canvasBox = await canvas.boundingBox();

	if (!canvasBox) {
		throw new Error('Canvas is not visible');
	}

	await page.mouse.move(canvasBox.x + start.x, canvasBox.y + start.y);
	await page.mouse.down();
	await page.mouse.move(canvasBox.x + end.x, canvasBox.y + end.y, {
		steps: 5,
	});
}

async function selectBothNodes(page: Page) {
	await dragWithinCanvas(page, { x: 150, y: 220 }, { x: 650, y: 380 });
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('application', { name: 'Canvas workspace' }),
	).toBeVisible();
});

test('creates and edits a text node', async ({ page }) => {
	const node = await createTextNode(page, 'Release checklist');

	await expect(node).toHaveAttribute('data-selected', 'true');
	await expect(node.locator('textarea')).toHaveCount(0);
});

test('offsets nodes created at the same canvas position', async ({ page }) => {
	const nodes = page.locator(nodeSelector);

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	await expect(nodes).toHaveCount(1);
	await page.keyboard.press('Escape');

	await page.keyboard.press('l');
	await expect(nodes).toHaveCount(2);

	const firstCenter = await getNodeCenter(nodes.nth(0));
	const secondCenter = await getNodeCenter(nodes.nth(1));

	expect(secondCenter).toEqual({
		x: firstCenter.x + 24,
		y: firstCenter.y + 24,
	});
});

test('replaces all node content with a skeleton below 60% zoom', async ({
	page,
}) => {
	await page.getByRole('button', { name: 'Link', exact: true }).click();
	const linkNode = page.locator(nodeSelector).first();
	await linkNode.locator('input').first().fill('Project brief');
	await linkNode.locator('input').last().fill('https://example.com/brief');
	await linkNode.locator('input').last().press('Escape');

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	const textNode = page.locator(nodeSelector).last();
	const textEditor = textNode.locator('textarea');
	await textEditor.fill('Release checklist');
	await expect(textEditor).toBeFocused();

	const canvas = page.getByRole('application', { name: 'Canvas workspace' });

	await canvas.dispatchEvent('wheel', { ctrlKey: true, deltaY: 60 });

	await expect(textNode).toHaveAttribute('data-node-detail', 'skeleton');
	await expect(linkNode).toHaveAttribute('data-node-detail', 'skeleton');
	await expect(page.locator('[data-node-skeleton]')).toHaveCount(2);
	await expect(textNode.locator(':scope > *')).toHaveCount(1);
	await expect(textEditor).toHaveCount(0);
	await expect(textNode).not.toContainText('Release checklist');
	await expect(linkNode).not.toContainText('Project brief');

	await canvas.dispatchEvent('wheel', { ctrlKey: true, deltaY: -60 });

	await expect(textNode).toHaveAttribute('data-node-detail', 'full');
	await expect(linkNode).toHaveAttribute('data-node-detail', 'full');
	await expect(page.locator('[data-node-skeleton]')).toHaveCount(0);
	await expect(textNode.locator('textarea')).toHaveCount(0);
	await expect(textNode).toContainText('Release checklist');
	await expect(linkNode).toContainText('Project brief');
});

test('culls nodes outside the viewport and restores them before they enter', async ({
	page,
}) => {
	const node = await createTextNode(page, 'Far away node');
	const canvas = page.getByRole('application', { name: 'Canvas workspace' });

	await pressKey(page, 'Shift+ArrowRight', 40);
	await expect(node).toHaveCount(0);

	await canvas.dispatchEvent('wheel', { deltaX: 200 });
	await expect(node).toHaveCount(1);

	const canvasBox = await canvas.boundingBox();
	const nodeBox = await node.boundingBox();

	if (!canvasBox || !nodeBox) {
		throw new Error('Canvas and overscanned node must have layout boxes');
	}

	expect(nodeBox.x).toBeGreaterThan(canvasBox.x + canvasBox.width);

	await canvas.dispatchEvent('wheel', { deltaX: 150 });
	await expect(node).toContainText('Far away node');
	await expect(node).toHaveAttribute('data-selected', 'true');
});

test('selects multiple nodes with a selection box in both directions', async ({
	page,
}) => {
	await createSeparatedNodes(page);

	await dragWithinCanvas(page, { x: 150, y: 220 }, { x: 650, y: 380 });
	await expect(page.getByTestId('canvas-selection-box')).toBeVisible();
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);

	await dragWithinCanvas(page, { x: 650, y: 380 }, { x: 150, y: 220 });
	await expect(page.getByTestId('canvas-selection-box')).toBeVisible();
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
});

test('moves a selected node by dragging it', async ({ page }) => {
	const node = await createTextNode(page, 'Move me');
	const startLeft = await node.evaluate((element) =>
		Number.parseFloat(element.style.left),
	);
	const startTop = await node.evaluate((element) =>
		Number.parseFloat(element.style.top),
	);
	const nodeBox = await node.boundingBox();

	if (!nodeBox) {
		throw new Error('Node is not visible');
	}

	await page.mouse.move(
		nodeBox.x + nodeBox.width / 2,
		nodeBox.y + nodeBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		nodeBox.x + nodeBox.width / 2 + 80,
		nodeBox.y + nodeBox.height / 2 + 60,
		{ steps: 5 },
	);
	await page.mouse.up();

	await expect
		.poll(() =>
			node.evaluate((element) => Number.parseFloat(element.style.left)),
		)
		.toBe(startLeft + 80);
	await expect
		.poll(() =>
			node.evaluate((element) => Number.parseFloat(element.style.top)),
		)
		.toBe(startTop + 60);
});

test('groups and ungroups the selected nodes', async ({ page }) => {
	await createSeparatedNodes(page);
	await selectBothNodes(page);

	await page.keyboard.press('Control+g');

	const group = page.getByRole('group', { name: 'Node group' });
	await expect(group).toHaveCount(1);
	await expect(group).toHaveAttribute('data-selected', 'true');

	await page.keyboard.press('Control+Shift+g');

	await expect(group).toHaveCount(0);
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
});

test('undoes and redoes node creation', async ({ page }) => {
	const nodes = page.locator(nodeSelector);

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	await expect(nodes).toHaveCount(1);

	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(nodes).toHaveCount(0);

	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(nodes).toHaveCount(1);
});
