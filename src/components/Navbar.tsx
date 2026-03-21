import { Link } from "@tanstack/react-router";

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-logo">
        <img src="/assets/images/taskora-logo.png" alt="Taskora Logo" />
        <div className="navbar-logo-text">Taskora</div>
      </div>

      <div className="navbar-buttons">
        <Link to="/login" className="sign-in-button">
          Autentificare
        </Link>
        <Link to="/signup" className="get-started-button">
          Începe acum
        </Link>
      </div>
    </div>
  );
}
