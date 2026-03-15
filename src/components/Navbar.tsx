export default function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-logo">
        <img src="/assets/images/taskora-logo.png" alt="Taskora Logo" />
        <div className="navbar-logo-text">Taskora</div>
      </div>

      <div className="navbar-buttons">
        <div className="sign-in-button">Autentificare</div>
        <div className="get-started-button">Începe acum</div>
      </div>
    </div>
  );
}
