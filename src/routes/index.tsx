import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import { FaArrowRight } from "react-icons/fa";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

type featuresType = {
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
            <div className="feature-container">
              <div className="feature-title">{feature.title}</div>
              <div className="feature-description">{feature.description}</div>
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
