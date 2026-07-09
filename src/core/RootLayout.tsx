import { Outlet, useMatches, type UIMatch } from 'react-router-dom';
import { Footer } from '@/core/Footer';
import { Header } from '@/core/Header';
import { useEffect } from 'react';

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
			<Header />
			<main className="grow custom-container mt-lg">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
