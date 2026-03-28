import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, db } from "../firebase/firebase";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const [numeAfisat, setNumeAfisat] = useState("");
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [arataParola, setArataParola] = useState(false);
  const [eroare, setEroare] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setEroare("");

    if (!numeAfisat.trim() || !email.trim() || !parola.trim()) {
      setEroare("Te rog să completezi toate câmpurile.");
      return;
    }

    if (parola.length < 6) {
      setEroare("Parola trebuie să conțină cel puțin 6 caractere.");
      return;
    }

    try {
      setLoading(true);

      const normalizedEmail = email.trim().toLowerCase();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        parola,
      );

      await updateProfile(userCredential.user, {
        displayName: numeAfisat.trim(),
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: normalizedEmail,
        displayName: numeAfisat.trim(),
        photoURL: "",
        createdAt: serverTimestamp(),
      });

      navigate({ to: "/app/dashboard" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      switch (error.code) {
        case "auth/email-already-in-use":
          setEroare("Există deja un cont creat cu această adresă de email.");
          break;
        case "auth/invalid-email":
          setEroare("Adresa de email nu este validă.");
          break;
        case "auth/weak-password":
          setEroare("Parola este prea slabă.");
          break;
        default:
          setEroare("A apărut o eroare la crearea contului. Încearcă din nou.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <Navbar />

      <div className="signup-page-container">
        <div className="signup-card">
          <div className="signup-card-header">
            <h1 className="signup-title">Creează-ți contul</h1>
            <p className="signup-subtitle">
              Începe să îți organizezi proiectele și task-urile cu Taskora.
            </p>
          </div>

          <form className="signup-form" onSubmit={handleSignup}>
            <div className="signup-form-group">
              <label htmlFor="numeAfisat">Nume afișat</label>
              <input
                id="numeAfisat"
                type="text"
                placeholder="Introdu numele afișat"
                value={numeAfisat}
                onChange={(e) => setNumeAfisat(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="signup-form-group">
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

            <div className="signup-form-group">
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

            {eroare && <p className="signup-error">{eroare}</p>}

            <button
              type="submit"
              className="signup-submit-button"
              disabled={loading}
            >
              {loading ? "Se creează contul..." : "Creează cont"}
            </button>
          </form>

          <div className="signup-footer">
            Ai deja un cont? <Link to="/login">Autentifică-te</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
