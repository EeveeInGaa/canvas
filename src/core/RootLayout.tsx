import { useEffect } from 'react';
import { Outlet, type UIMatch, useMatches } from 'react-router-dom';

type RouteHandle = {
	title?: string;
};

export function RootLayout() {
	const matches = useMatches() as UIMatch<unknown, RouteHandle>[];

	useEffect(() => {
		const match = [...matches].reverse().find((match) => match.handle?.title);
		const title = match?.handle?.title;

		document.title = title ?? 'My App';
	}, [matches]);

	return (
		<div className="flex min-h-screen flex-col">
			<main className="grow custom-container mt-lg">
				<Outlet />
			</main>
		</div>
	);
}
