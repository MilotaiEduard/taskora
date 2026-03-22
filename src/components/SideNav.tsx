import { Link } from "@tanstack/react-router";
import { MdSpaceDashboard } from "react-icons/md";
import { FaTasks } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";
import { FaCalendar } from "react-icons/fa";
import { FaFileLines } from "react-icons/fa6";
import { IoMdSettings } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "@tanstack/react-router";

type pagesType = {
  name: string;
  icon: React.ReactNode;
  link: string;
};

export default function SideNav() {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate({ to: "/login" });
  }

  return (
    <div className="sidenav-container">
      <Link to="/app/dashboard" className="sidenav-logo">
        <img src="/assets/images/taskora-text-logo.png" alt="Taskora Logo" />
      </Link>

      <div className="sidenav-pages-container">
        <div className="sidenav-pages">
          {pages.map((page) => (
            <Link to={page.link} className="sidenav-page" key={page.name}>
              <span className="sidenav-page-icon">{page.icon}</span>
              <span className="sidenav-page-name">{page.name}</span>
            </Link>
          ))}
        </div>

        <div className="sidenav-footer">
          <Link to="/app/settings" className="sidenav-footer-link">
            <span className="sidenav-footer-icon">{<IoMdSettings />}</span>
            <span className="sidenav-footer-name">Setări</span>
          </Link>

          <div className="sidenav-logout" onClick={handleLogout}>
            <span className="sidenav-footer-icon">
              <MdLogout />
            </span>
            <span className="sidenav-footer-name">Deconectează-te</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const pages: pagesType[] = [
  {
    name: "Dashboard",
    icon: <MdSpaceDashboard />,
    link: "/app/dashboard",
  },
  {
    name: "Proiecte",
    icon: <FaFileLines />,
    link: "/app/projects",
  },
  {
    name: "Newslettere",
    icon: <IoIosMail />,
    link: "/app/newsletters",
  },
  {
    name: "Task-urile mele",
    icon: <FaTasks />,
    link: "/app/tasks",
  },
  {
    name: "Calendar",
    icon: <FaCalendar />,
    link: "/app/calendar",
  },
];
