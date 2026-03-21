import { createFileRoute, Link } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import { FaArrowRight } from "react-icons/fa";
import { GrProjects } from "react-icons/gr";
import { FaTasks } from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import { IoIosMail } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
import { VscGraph } from "react-icons/vsc";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import { FaShield } from "react-icons/fa6";
import { FaPalette } from "react-icons/fa6";
import { FaGlobe } from "react-icons/fa";
import { FaBolt } from "react-icons/fa6";
import { RiLayout5Fill } from "react-icons/ri";
import type { ReactElement } from "react";
import Footer from "../components/Footer";

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

type builtForCardType = {
  title: string;
  description: string;
  items: string[];
};

type qualityFeaturesCardType = {
  icon: ReactElement;
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
          <br className="mobile-no-br" /> Creează proiecte, atribuie task-uri,
          gestionează newslettere și urmărește progresul echipei tale în timp
          real.
        </div>

        <div className="main-section-buttons">
          <Link to="/signup" className="main-section-get-started-button">
            Începe gratuit <FaArrowRight />
          </Link>
          <Link to="/login" className="main-section-sign-in-button">
            Autentificare
          </Link>
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
          proiecte, atribui task-uri și <br className="mobile-no-br" /> coordona
          echipa într-o singură platformă simplă și eficientă.
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

      <div className="built-for-section">
        <div className="built-for-section-title">
          Creată pentru utilizatori individuali și echipe de orice dimensiune
        </div>

        <div className="built-for-section-subtitle">
          Taskora se adaptează nevoilor tale, de la organizarea personală a
          task-urilor <br className="mobile-no-br" />
          până la gestionarea proiectelor pentru echipe.
        </div>

        <div className="built-for-section-cards">
          {builtForCards.map((card) => (
            <div className="built-for-section-card" key={card.title}>
              <div className="built-for-section-card-title">{card.title}</div>
              <div className="built-for-section-card-description">
                {card.description}
              </div>

              <div className="built-for-section-card-items">
                {card.items.map((item) => (
                  <div className="built-for-section-card-item" key={item}>
                    <div className="built-for-section-card-item-icon">
                      <IoCheckmarkCircleOutline />
                    </div>
                    <div className="built-for-section-card-item-text">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="quality-features-section">
        <div className="quality-features-section-title">
          Funcționalități avansate pentru productivitate
        </div>

        <div className="quality-features-section-subtitle">
          Capabilități moderne care fac Taskora rapidă, intuitivă și ușor de
          folosit.
        </div>

        <div className="quality-features-section-cards">
          {qualityFeaturesCard.map((card) => (
            <div className="quality-features-section-card">
              <div className="quality-features-section-card-icon">
                {card.icon}
              </div>
              <div className="quality-features-section-card-title-description-container">
                <div className="quality-features-section-card-title">
                  {card.title}
                </div>
                <div className="quality-features-section-card-description">
                  {card.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Footer />
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

const builtForCards: builtForCardType[] = [
  {
    title: "Pentru utilizatori individuali",
    description:
      "Ideală pentru organizarea task-urilor personale, planificarea activităților și urmărirea progresului.",
    items: [
      "Dashboard personal",
      "Gestionarea priorităților",
      "Urmărirea progresului task-urilor",
      "Organizarea activităților",
    ],
  },
  {
    title: "Pentru echipe mici",
    description:
      "Perfectă pentru echipe mici și proiecte colaborative. Coordonează task-uri și urmărește progresul echipei.",
    items: [
      "Spații de lucru pentru echipă",
      "Atribuirea task-urilor",
      "Vizibilitate asupra progresului",
      "Colaborare simplă între membri",
    ],
  },
  {
    title: "Pentru organizații",
    description:
      "Gestionarea proiectelor la nivel de echipă cu roluri diferite și control asupra activităților.",
    items: [
      "Acces bazat pe roluri",
      "Statistici și dashboard pentru manageri",
      "Gestionarea echipei",
      "Structură organizată a proiectelor",
    ],
  },
];

const qualityFeaturesCard: qualityFeaturesCardType[] = [
  {
    icon: <RiLayout5Fill />,
    title: "Interfață intuitivă",
    description:
      "Interfață simplă care îți permite să gestionezi proiecte și task-uri fără complexitate inutilă.",
  },
  {
    icon: <IoIosNotifications />,
    title: "Notificări inteligente",
    description:
      "Primește actualizări despre task-uri atribuite, modificări de proiect și activitatea echipei.",
  },
  {
    icon: <FaShield />,
    title: "Acces securizat",
    description:
      "Autentificare sigură și gestionarea accesului în funcție de rolurile utilizatorilor.",
  },
  {
    icon: <FaPalette />,
    title: "Design modern",
    description:
      "Interfață curată și modernă, optimizată pentru utilizare rapidă și experiență plăcută.",
  },
  {
    icon: <FaGlobe />,
    title: "Colaborare în timp real",
    description:
      "Actualizările proiectelor și task-urilor sunt vizibile instant pentru toți membrii echipei.",
  },
  {
    icon: <FaBolt />,
    title: "Performanță optimizată",
    description:
      "Aplicație rapidă și fluidă, optimizată pentru gestionarea eficientă a proiectelor.",
  },
];
