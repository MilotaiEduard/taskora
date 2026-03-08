import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import { FaArrowRight } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";
import { FaTasks } from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import { IoIosMail } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
import { VscGraph } from "react-icons/vsc";
import type { ReactElement } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

type featuresType = {
  title: string;
  description: string;
};

type featuresCardType = {
  icon: ReactElement | string;
  badge: string;
  title: string;
  description: string;
};

function RouteComponent() {
  return (
    <div className="landing-page-container">
      <Navbar />

      <div className="main-section">
        <div className="main-section-title">
          Organizează proiectele. Coordonează echipa.
          <br /> Livrează <span className="primary-text">rezultate</span>
        </div>

        <div className="main-section-description">
          Taskora combină managementul proiectelor, organizarea task-urilor și
          coordonarea echipei într-o singură platformă.
          <br /> Creează proiecte, atribuie task-uri, gestionează newslettere și
          urmărește progresul echipei tale în timp real.
        </div>

        <div className="main-section-buttons">
          <div className="main-section-get-started-button">
            Începe gratuit <FaArrowRight />
          </div>
          <div className="main-section-sign-in-button">Autentificare</div>
        </div>

        <div className="main-section-features">
          {features.map((feature) => (
            <div className="feature-container" key={feature.title}>
              <div className="feature-title">{feature.title}</div>
              <div className="feature-description">{feature.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-section">
        <div className="features-section-title">
          Tot ce ai nevoie pentru a gestiona proiectele eficient
        </div>

        <div className="features-section-subtitle">
          Taskora îți oferă toate funcționalitățile necesare pentru a organiza
          proiecte, atribui task-uri și <br /> coordona echipa într-o singură
          platformă simplă și eficientă.
        </div>

        <div className="features-section-cards">
          {featuresCard.map((feature) => (
            <div className="features-section-card" key={feature.title}>
              <div className="features-section-card-icon-badge">
                <div className="features-section-card-icon">{feature.icon}</div>
                <div className="features-section-card-badge">
                  {feature.badge}
                </div>
              </div>
              <div className="features-section-card-title">{feature.title}</div>
              <div className="features-section-card-description">
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const features: featuresType[] = [
  {
    title: "Colaborare în timp real",
    description:
      "Toți membrii echipei pot vedea actualizările proiectelor și task-urilor instant.",
  },
  {
    title: "Management avansat al proiectelor",
    description:
      "Creează proiecte, atribuie task-uri și urmărește progresul echipei într-un mod organizat.",
  },
  {
    title: "Control și organizare",
    description:
      "Managerii pot coordona echipa, monitoriza activitatea și gestiona proiectele eficient.",
  },
];

const featuresCard: featuresCardType[] = [
  {
    icon: <GrProjects />,
    badge: "Management proiecte",
    title: "Gestionarea proiectelor",
    description:
      "Creează proiecte, stabilește deadline-uri și organizează activitățile echipei într-un mod clar și structurat.",
  },
  {
    icon: <MdAssignment />,
    badge: "Colaborare echipă",
    title: "Atribuire task-uri",
    description:
      "Managerii pot atribui task-uri membrilor echipei și pot urmări progresul fiecărei activități.",
  },
  {
    icon: <IoIosMail />,
    badge: "Organizare",
    title: "Gestionarea newsletterelor",
    description:
      "Planifică și organizează newsletterele din cadrul proiectelor pentru o coordonare mai bună a campaniilor.",
  },
  {
    icon: <FaTasks />,
    badge: "Flux de lucru",
    title: "Managementul task-urilor",
    description:
      "Urmărește stadiul task-urilor de la început până la final și organizează activitățile în funcție de priorități și deadline-uri.",
  },
  {
    icon: <IoIosSearch />,
    badge: "Productivitate",
    title: "Căutare și filtrare",
    description:
      "Găsește rapid proiecte, task-uri sau membri ai echipei folosind funcții simple de căutare și filtrare.",
  },
  {
    icon: <VscGraph />,
    badge: "Statistici",
    title: "Dashboard pentru manageri",
    description:
      "Managerii pot vedea statistici despre progresul proiectelor, task-urile finalizate și activitatea echipei.",
  },
];
