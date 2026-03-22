import { useEffect, useRef, useState } from "react";
import { IoNotificationsOutline, IoSettingsOutline } from "react-icons/io5";
import { MdLogout } from "react-icons/md";
import { LuSearch } from "react-icons/lu";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useNavigate } from "@tanstack/react-router";
import { auth } from "../firebase/firebase";

export default function AppMainBar() {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const avatarSrc = user?.photoURL?.trim()
    ? user.photoURL
    : "https://i.pravatar.cc/100?img=12";

  return (
    <div className="app-main-bar">
      <div className="app-main-bar-search">
        <LuSearch className="app-main-bar-search-icon" />
        <input type="text" placeholder="Caută" />
      </div>

      <div className="app-main-bar-actions">
        <button
          type="button"
          className="app-main-bar-notifications"
          aria-label="Notificări"
        >
          <IoNotificationsOutline />
        </button>

        <div className="app-main-bar-profile" ref={profileMenuRef}>
          <button
            type="button"
            className="app-main-bar-avatar-button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="Deschide meniul profilului"
          >
            <img src={avatarSrc} alt="Avatar utilizator" />
          </button>

          {isProfileMenuOpen && (
            <div className="app-main-bar-profile-menu">
              <button
                type="button"
                className="app-main-bar-profile-menu-item"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate({ to: "/app/settings" });
                }}
              >
                <span className="app-main-bar-profile-menu-item-icon">
                  <IoSettingsOutline />
                </span>
                <span>Setări</span>
              </button>

              <button
                type="button"
                className="app-main-bar-profile-menu-item logout"
                onClick={handleLogout}
              >
                <span className="app-main-bar-profile-menu-item-icon">
                  <MdLogout />
                </span>
                <span>Deconectează-te</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
