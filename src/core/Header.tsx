import { Link } from 'react-router-dom';

export function Header() {
	return (
		<header className="custom-container">
			<Link to="/" className="hover:underline">
				Go to home
			</Link>
		</header>
	);
}
