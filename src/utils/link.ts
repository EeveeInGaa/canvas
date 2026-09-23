const SUPPORTED_SCHEME_PATTERN = /^https?:\/\//i;

function looksLikeHost(value: string): boolean {
	const authority = value.split(/[/?#]/, 1)[0] ?? '';
	const hostname = authority.split(':', 1)[0]?.toLowerCase() ?? '';

	return (
		hostname === 'localhost' ||
		hostname.includes('.') ||
		/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
	);
}

export function getSafeLinkUrl(value: string): string | null {
	const trimmedValue = value.trim();

	if (!trimmedValue || /\s/.test(trimmedValue)) {
		return null;
	}

	const candidate = SUPPORTED_SCHEME_PATTERN.test(trimmedValue)
		? trimmedValue
		: looksLikeHost(trimmedValue)
			? `https://${trimmedValue}`
			: null;

	if (!candidate) {
		return null;
	}

	try {
		const url = new URL(candidate);

		return (url.protocol === 'https:' || url.protocol === 'http:') &&
			url.hostname
			? url.href
			: null;
	} catch {
		return null;
	}
}
