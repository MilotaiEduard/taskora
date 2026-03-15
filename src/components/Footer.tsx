import { FaArrowRight } from "react-icons/fa";

export default function Footer() {
  return (
    <div className="footer">
      <div className="footer-main">
        <div className="footer-main-title">
          Gata să îți organizezi proiectele <br />
          mai eficient?
        </div>
        <div className="footer-main-subtitle">
          Creează proiecte, atribuie task-uri și urmărește progresul cu Taskora.
        </div>

        <div className="footer-main-buttons">
          <div className="footer-main-get-started-button">
            Începe gratuit <FaArrowRight />
          </div>
          <div className="footer-main-sign-in-button">Autentificare</div>
        </div>
      </div>
      <div className="footer-credit">
        © {new Date().getFullYear()} Taskora. Toate drepturile rezervate.
        Aplicație creată cu ❤️ de{" "}
        <a
          href="https://eduardmilotai.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Eduard Milotai
        </a>
        .
      </div>
    </div>
  );
}
