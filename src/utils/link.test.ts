import { describe, expect, it } from 'vitest';

import { getSafeLinkUrl } from '@/utils/link';

describe('getSafeLinkUrl', () => {
	it('normalizes a common hostname to HTTPS', () => {
		expect(getSafeLinkUrl('example.com/brief')).toBe(
			'https://example.com/brief',
		);
	});

	it('normalizes local hosts with ports to HTTPS', () => {
		expect(getSafeLinkUrl('localhost:4173/brief')).toBe(
			'https://localhost:4173/brief',
		);
	});

	it('keeps supported absolute URLs', () => {
		expect(getSafeLinkUrl('http://example.com/brief')).toBe(
			'http://example.com/brief',
		);
	});

	it.each([
		'',
		'/brief',
		'brief/path',
		'not a url',
		'http:example.com',
		'javascript:alert(1)',
	])('rejects %j', (value) => {
		expect(getSafeLinkUrl(value)).toBeNull();
	});
});
