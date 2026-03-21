import { Link } from "@tanstack/react-router";

export default function Navbar() {
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="navbar">
      <Link to="/" className="navbar-logo" onClick={() => scrollToTop()}>
        <img
          src="/assets/images/taskora-text-logo.png"
          alt="Taskora Text Logo"
        />
      </Link>

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
