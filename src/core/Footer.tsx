import { Link } from "react-router-dom";

export function Footer() {
    return (
      <footer className="custom-container">
          <nav aria-label="Footer">
              <ul className="flex gap-4">
                  <li>
                      <Link to="/terms" className="hover:underline">Terms</Link>
                  </li>
                  <li>
                      <Link to="/privacy" className="hover:underline">Privacy</Link>
                  </li>
                  <li>
                      <Link to="/imprint" className="hover:underline">Imprint</Link>
                  </li>
              </ul>
          </nav>
      </footer>
    );
  }
  