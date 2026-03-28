import { createFileRoute } from "@tanstack/react-router";
import {
  onAuthStateChanged,
  updateProfile,
  reload,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { auth, db } from "../../firebase/firebase";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [numeAfisat, setNumeAfisat] = useState("");
  const [pozaProfil, setPozaProfil] = useState("");
  const [fisierImagine, setFisierImagine] = useState<File | null>(null);
  const [previewImagine, setPreviewImagine] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eroare, setEroare] = useState("");
  const [succes, setSucces] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setNumeAfisat(currentUser.displayName || "");
        setPozaProfil(currentUser.photoURL || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (previewImagine) {
        URL.revokeObjectURL(previewImagine);
      }
    };
  }, [previewImagine]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;

    setEroare("");
    setSucces("");

    if (!file) {
      setFisierImagine(null);
      setPreviewImagine("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setEroare("Te rog să selectezi un fișier imagine valid.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setEroare("Imaginea trebuie să aibă maximum 2MB.");
      return;
    }

    setFisierImagine(file);

    if (previewImagine) {
      URL.revokeObjectURL(previewImagine);
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewImagine(localPreview);
  }

  async function uploadImageToCloudinary(file: File) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Lipsesc variabilele Cloudinary din fișierul .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Upload-ul imaginii a eșuat.");
    }

    return data.secure_url as string;
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setEroare("");
    setSucces("");

    if (!user) {
      setEroare("Nu există niciun utilizator autentificat.");
      return;
    }

    if (!numeAfisat.trim()) {
      setEroare("Numele afișat nu poate fi gol.");
      return;
    }

    try {
      setSaving(true);

      let photoURL = pozaProfil;

      if (fisierImagine) {
        photoURL = await uploadImageToCloudinary(fisierImagine);
      }

      await updateProfile(user, {
        displayName: numeAfisat.trim(),
        photoURL,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email?.toLowerCase() || "",
          displayName: numeAfisat.trim(),
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await reload(user);

      setUser(auth.currentUser);
      setPozaProfil(photoURL);
      setFisierImagine(null);
      setPreviewImagine("");
      setSucces("Datele profilului au fost actualizate cu succes.");
    } catch (error) {
      console.error(error);
      setEroare("A apărut o eroare la salvarea modificărilor.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">Se încarcă setările...</div>
      </div>
    );
  }

  const imagineAfisata = previewImagine || pozaProfil;

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1 className="settings-page-title">Setări cont</h1>
        <p className="settings-page-subtitle">
          Actualizează informațiile profilului tău și personalizează modul în
          care apari în aplicație.
        </p>
      </div>

      <div className="settings-content">
        <div className="settings-profile-preview-card">
          <div className="settings-profile-preview-avatar">
            {imagineAfisata.trim() ? (
              <img src={imagineAfisata} alt="Poză profil" />
            ) : (
              <div className="settings-profile-preview-avatar-placeholder">
                {numeAfisat?.trim()?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="settings-profile-preview-info">
            <div className="settings-profile-preview-name">
              {numeAfisat || "Utilizator Taskora"}
            </div>
            <div className="settings-profile-preview-email">
              {user?.email || "Fără email"}
            </div>
          </div>
        </div>

        <form className="settings-form-card" onSubmit={handleSave}>
          <div className="settings-form-header">
            <h2>Date profil</h2>
            <p>Poți modifica numele afișat și imaginea de profil.</p>
          </div>

          <div className="settings-form-group">
            <label>Imagine profil</label>

            <div className="settings-file-input">
              <label htmlFor="pozaProfil" className="settings-file-button">
                Alege imagine
              </label>

              <span className="settings-file-name">
                {fisierImagine ? fisierImagine.name : "Nicio imagine selectată"}
              </span>

              <input
                id="pozaProfil"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </div>

            <span className="settings-form-note">
              Selectează o imagine din calculator. Dimensiune maximă: 2MB.
            </span>
          </div>

          <div className="settings-form-group">
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

          <div className="settings-form-group">
            <label htmlFor="email">Adresă de email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              readOnly
            />
            <span className="settings-form-note">
              Adresa de email nu poate fi modificată.
            </span>
          </div>

          {eroare && <div className="settings-message error">{eroare}</div>}
          {succes && <div className="settings-message success">{succes}</div>}

          <div className="settings-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
