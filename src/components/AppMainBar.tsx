import { useEffect, useRef, useState } from "react";
import { IoNotificationsOutline, IoSettingsOutline } from "react-icons/io5";
import { MdLogout } from "react-icons/md";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useNavigate } from "@tanstack/react-router";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "project_added" | "task_assigned";
  isRead: boolean;
  recipientId: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
};

export default function AppMainBar() {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) {
        setNotifications([]);
        return;
      }

      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("recipientId", "==", user.uid),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(q);

        const fetchedNotifications: NotificationItem[] = snapshot.docs.map(
          (docItem) => ({
            id: docItem.id,
            title: docItem.data().title,
            message: docItem.data().message,
            type: docItem.data().type,
            isRead: docItem.data().isRead,
            recipientId: docItem.data().recipientId,
            createdAt: docItem.data().createdAt,
          }),
        );

        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Eroare la încărcarea notificărilor:", error);
      }
    }

    fetchNotifications();
  }, [user]);

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Eroare la actualizarea notificării:", error);
    }
  }

  async function markAllAsRead() {
    try {
      const unreadNotifications = notifications.filter(
        (notification) => !notification.isRead,
      );

      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "notifications", notification.id), {
            isRead: true,
          }),
        ),
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      console.error("Eroare la actualizarea notificărilor:", error);
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

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
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

  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.isRead,
  );

  return (
    <div className="app-main-bar">
      <div className="app-main-bar-actions">
        <div
          className="app-main-bar-notifications-wrapper"
          ref={notificationsRef}
        >
          <button
            type="button"
            className="app-main-bar-notifications"
            aria-label="Notificări"
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsProfileMenuOpen(false);
            }}
          >
            <IoNotificationsOutline />
            {hasUnreadNotifications && (
              <span className="app-main-bar-notifications-badge"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="app-main-bar-notifications-menu">
              <div className="app-main-bar-notifications-header">
                <span>Notificări</span>

                {hasUnreadNotifications && (
                  <button type="button" onClick={markAllAsRead}>
                    Marchează tot ca citit
                  </button>
                )}
              </div>

              <div className="app-main-bar-notifications-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`app-main-bar-notification-item ${notification.isRead ? "read" : "unread"}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="app-main-bar-notification-title">
                        {notification.title}
                      </div>
                      <div className="app-main-bar-notification-message">
                        {notification.message}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="app-main-bar-notifications-empty">
                    Nu ai notificări momentan.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="app-main-bar-profile" ref={profileMenuRef}>
          <button
            type="button"
            className="app-main-bar-avatar-button"
            onClick={() => {
              setIsProfileMenuOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
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
