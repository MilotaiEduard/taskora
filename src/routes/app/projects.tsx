import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { IoClose, IoEllipsisHorizontal } from "react-icons/io5";
import { MdOutlineAdd } from "react-icons/md";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export const Route = createFileRoute("/app/projects")({
  component: RouteComponent,
});

type ProjectStatus = "Planificat" | "În lucru" | "Finalizat";
type ProjectType = "Individual" | "De echipă";

type ProjectTypeData = {
  id: string;
  name: string;
  client: string;
  type: ProjectType;
  status: ProjectStatus;
  deadline: string;
  description: string;
  ownerId: string;
};

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("Individual");
  const [status, setStatus] = useState<ProjectStatus>("Planificat");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const projectsRef = collection(db, "projects");
        const q = query(
          projectsRef,
          where("ownerId", "==", user.uid),
          orderBy("createdAt", "desc"),
        );

        const querySnapshot = await getDocs(q);

        const fetchedProjects: ProjectTypeData[] = querySnapshot.docs.map(
          (docItem) => ({
            id: docItem.id,
            name: docItem.data().name,
            client: docItem.data().client,
            type: docItem.data().type,
            status: docItem.data().status,
            deadline: docItem.data().deadline,
            description: docItem.data().description,
            ownerId: docItem.data().ownerId,
          }),
        );

        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Eroare la încărcarea proiectelor:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function resetForm() {
    setProjectName("");
    setClient("");
    setProjectType("Individual");
    setStatus("Planificat");
    setDeadline("");
    setDescription("");
    setError("");
    setSelectedProjectId(null);
    setIsEditMode(false);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function openEditModal(project: ProjectTypeData) {
    setProjectName(project.name);
    setClient(project.client);
    setProjectType(project.type);
    setStatus(project.status);
    setDeadline(project.deadline);
    setDescription(project.description);
    setSelectedProjectId(project.id);
    setIsEditMode(true);
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  async function fetchProjectsAgain() {
    if (!user) return;

    try {
      const projectsRef = collection(db, "projects");
      const q = query(
        projectsRef,
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);

      const fetchedProjects: ProjectTypeData[] = querySnapshot.docs.map(
        (docItem) => ({
          id: docItem.id,
          name: docItem.data().name,
          client: docItem.data().client,
          type: docItem.data().type,
          status: docItem.data().status,
          deadline: docItem.data().deadline,
          description: docItem.data().description,
          ownerId: docItem.data().ownerId,
        }),
      );

      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Eroare la reîncărcarea proiectelor:", error);
    }
  }

  async function handleSaveProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Trebuie să fii autentificat pentru a salva un proiect.");
      return;
    }

    if (!projectName.trim() || !client.trim() || !deadline.trim()) {
      setError("Te rog să completezi toate câmpurile obligatorii.");
      return;
    }

    try {
      if (isEditMode && selectedProjectId) {
        const projectRef = doc(db, "projects", selectedProjectId);

        await updateDoc(projectRef, {
          name: projectName.trim(),
          client: client.trim(),
          type: projectType,
          status,
          deadline,
          description: description.trim(),
        });
      } else {
        await addDoc(collection(db, "projects"), {
          name: projectName.trim(),
          client: client.trim(),
          type: projectType,
          status,
          deadline,
          description: description.trim(),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      await fetchProjectsAgain();
      closeModal();
    } catch (error) {
      console.error("Eroare la salvarea proiectului:", error);
      setError("A apărut o eroare la salvarea proiectului.");
    }
  }

  async function handleDeleteProject(projectId: string) {
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setOpenMenuId(null);
    } catch (error) {
      console.error("Eroare la ștergerea proiectului:", error);
    }
  }

  function getStatusClass(projectStatus: ProjectStatus) {
    switch (projectStatus) {
      case "Planificat":
        return "planned";
      case "În lucru":
        return "in-progress";
      case "Finalizat":
        return "completed";
      default:
        return "";
    }
  }

  return (
    <div className="projects-page">
      <div className="projects-page-header">
        <div className="projects-page-header-text">
          <h1 className="projects-page-title">Proiecte</h1>
          <p className="projects-page-subtitle">
            Creează și gestionează proiectele tale individuale sau de echipă
            într-un singur loc.
          </p>
        </div>

        <button className="projects-create-button" onClick={openCreateModal}>
          <MdOutlineAdd />
          Creează proiect
        </button>
      </div>

      <div className="projects-page-content">
        {loading ? (
          <div className="projects-empty-state">
            <h2>Se încarcă proiectele...</h2>
          </div>
        ) : projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <div className="project-card" key={project.id}>
                <div className="project-card-top">
                  <div className="project-card-title-section">
                    <h2 className="project-card-title">{project.name}</h2>
                    <p className="project-card-client">{project.client}</p>
                  </div>

                  <div className="project-card-actions" ref={menuRef}>
                    <button
                      className="project-card-menu-button"
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === project.id ? null : project.id,
                        )
                      }
                    >
                      <IoEllipsisHorizontal />
                    </button>

                    {openMenuId === project.id && (
                      <div className="project-card-menu">
                        <button onClick={() => openEditModal(project)}>
                          Editează
                        </button>
                        <button
                          className="delete-action"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          Șterge
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="project-card-meta">
                  <div
                    className={`project-card-status ${getStatusClass(project.status)}`}
                  >
                    {project.status}
                  </div>
                </div>

                <div className="project-card-info">
                  <div className="project-card-info-item">
                    <span className="label">Tip</span>
                    <span className="value">{project.type}</span>
                  </div>

                  <div className="project-card-info-item">
                    <span className="label">Deadline</span>
                    <span className="value">{project.deadline}</span>
                  </div>
                </div>

                <div className="project-card-description">
                  {project.description || "Fără descriere disponibilă."}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="projects-empty-state">
            <h2>Nu există proiecte momentan</h2>
            <p>
              Creează primul tău proiect pentru a începe organizarea
              activității.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="projects-modal-overlay" onClick={closeModal}>
          <div className="projects-modal" onClick={(e) => e.stopPropagation()}>
            <div className="projects-modal-header">
              <div>
                <h2>{isEditMode ? "Editează proiect" : "Creează proiect"}</h2>
                <p>
                  {isEditMode
                    ? "Actualizează informațiile proiectului."
                    : "Completează informațiile de bază ale proiectului."}
                </p>
              </div>

              <button className="projects-modal-close" onClick={closeModal}>
                <IoClose />
              </button>
            </div>

            <form className="projects-form" onSubmit={handleSaveProject}>
              <div className="projects-form-group">
                <label htmlFor="projectName">Nume proiect</label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="Introdu numele proiectului"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="projects-form-group">
                <label htmlFor="client">Client</label>
                <input
                  id="client"
                  type="text"
                  placeholder="Introdu numele clientului"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </div>

              <div className="projects-form-row">
                <div className="projects-form-group">
                  <label htmlFor="projectType">Tip proiect</label>
                  <select
                    id="projectType"
                    value={projectType}
                    onChange={(e) =>
                      setProjectType(e.target.value as ProjectType)
                    }
                  >
                    <option value="Individual">Individual</option>
                    <option value="De echipă">De echipă</option>
                  </select>
                </div>

                <div className="projects-form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  >
                    <option value="Planificat">Planificat</option>
                    <option value="În lucru">În lucru</option>
                    <option value="Finalizat">Finalizat</option>
                  </select>
                </div>
              </div>

              <div className="projects-form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="projects-form-group">
                <label htmlFor="description">Descriere</label>
                <textarea
                  id="description"
                  placeholder="Adaugă o scurtă descriere a proiectului"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && <div className="projects-form-error">{error}</div>}

              <div className="projects-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
                  Anulează
                </button>
                <button type="submit" className="primary-button">
                  {isEditMode ? "Salvează modificările" : "Salvează proiectul"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
