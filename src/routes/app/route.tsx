import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import SideNav from "../../components/SideNav";
import AppMainBar from "../../components/AppMainBar";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();

  const isSettingsPage = location.pathname.startsWith("/app/settings");

  return (
    <div className="app-layout">
      <SideNav />

      <div className="app-right-section">
        {!isSettingsPage && <AppMainBar />}
        <div className="app-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
