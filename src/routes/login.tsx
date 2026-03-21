import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { auth } from "../firebase/firebase";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [arataParola, setArataParola] = useState(false);
  const [eroare, setEroare] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setEroare("");

    if (!email.trim() || !parola.trim()) {
      setEroare("Te rog să completezi toate câmpurile.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, parola);

      navigate({ to: "/app/dashboard" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      switch (error.code) {
        case "auth/invalid-email":
          setEroare("Adresa de email nu este validă.");
          break;
        case "auth/user-not-found":
          setEroare("Nu există niciun cont asociat acestei adrese de email.");
          break;
        case "auth/wrong-password":
          setEroare("Parola introdusă este incorectă.");
          break;
        case "auth/invalid-credential":
          setEroare("Emailul sau parola sunt incorecte.");
          break;
        default:
          setEroare("A apărut o eroare la autentificare. Încearcă din nou.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Navbar />

      <div className="login-page-container">
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Bine ai revenit!</h1>
            <p className="login-subtitle">
              Autentifică-te pentru a-ți continua activitatea în Taskora.
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-form-group">
              <label htmlFor="email">Adresă de email</label>
              <input
                id="email"
                type="email"
                placeholder="Introdu adresa de email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="parola">Parolă</label>

              <div className="password-input-wrapper">
                <input
                  id="parola"
                  type={arataParola ? "text" : "password"}
                  placeholder="Introdu parola"
                  value={parola}
                  onChange={(e) => setParola(e.target.value)}
                />

                <button
                  type="button"
                  className="toggle-password-button"
                  onClick={() => setArataParola((prev) => !prev)}
                  aria-label={
                    arataParola ? "Ascunde parola" : "Afișează parola"
                  }
                >
                  {arataParola ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {eroare && <p className="login-error">{eroare}</p>}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Se autentifică..." : "Autentificare"}
            </button>
          </form>

          <div className="login-footer">
            Nu ai încă un cont? <Link to="/signup">Creează unul</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
