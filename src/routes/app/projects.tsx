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
type ProjectKind = "Individual" | "De echipă";

type ProjectMember = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "owner" | "member";
};

type TeamData = {
  id: string;
  name: string;
  ownerId: string;
  members: ProjectMember[];
  memberIds: string[];
};

type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};

type ProjectData = {
  id: string;
  name: string;
  client: string;
  type: ProjectKind;
  status: ProjectStatus;
  deadline: string;
  description: string;
  ownerId: string;
  ownerDisplayName: string;
  teamId: string | null;
  teamName: string | null;
  memberIds: string[];
  members: ProjectMember[];
  createdAt?: FirestoreTimestampLike;
};

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [ownedTeams, setOwnedTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [projectType, setProjectType] = useState<ProjectKind>("Individual");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Planificat");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchOwnedTeams() {
      if (!user) {
        setOwnedTeams([]);
        setTeamsLoading(false);
        return;
      }

      try {
        setTeamsLoading(true);

        const teamsRef = collection(db, "teams");
        const q = query(teamsRef, where("ownerId", "==", user.uid));
        const snapshot = await getDocs(q);

        const fetchedTeams: TeamData[] = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          name: docItem.data().name,
          ownerId: docItem.data().ownerId,
          members: docItem.data().members || [],
          memberIds: docItem.data().memberIds || [],
        }));

        setOwnedTeams(fetchedTeams);
      } catch (err) {
        console.error("Eroare la încărcarea echipelor:", err);
      } finally {
        setTeamsLoading(false);
      }
    }

    fetchOwnedTeams();
  }, [user]);

  function formatDateForInput(dateString: string) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }

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
        where("memberIds", "array-contains", user.uid),
      );
      const querySnapshot = await getDocs(q);

      const fetchedProjects: ProjectData[] = querySnapshot.docs.map(
        (docItem) => ({
          id: docItem.id,
          name: docItem.data().name,
          client: docItem.data().client,
          type: docItem.data().type,
          status: docItem.data().status,
          deadline: docItem.data().deadline,
          description: docItem.data().description,
          ownerId: docItem.data().ownerId,
          ownerDisplayName: docItem.data().ownerDisplayName || "Owner",
          teamId: docItem.data().teamId || null,
          teamName: docItem.data().teamName || null,
          memberIds: docItem.data().memberIds || [],
          members: docItem.data().members || [],
          createdAt: docItem.data().createdAt,
        }),
      );

      fetchedProjects.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds || 0;
        const bSeconds = b.createdAt?.seconds || 0;
        return bSeconds - aSeconds;
      });

      setProjects(fetchedProjects);
    } catch (fetchError) {
      console.error("Eroare la încărcarea proiectelor:", fetchError);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(event.target as Node)
      ) {
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
    setSelectedTeamId("");
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

  function openEditModal(project: ProjectData) {
    setProjectName(project.name);
    setClient(project.client);
    setProjectType(project.type);
    setSelectedTeamId(project.teamId || "");
    setStatus(project.status);
    setDeadline(project.deadline);
    setDescription(project.description);
    setSelectedProjectId(project.id);
    setIsEditMode(true);
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function getSelectedTeam() {
    return ownedTeams.find((team) => team.id === selectedTeamId) || null;
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

    let members: ProjectMember[] = [];
    let memberIds: string[] = [];
    let teamId: string | null = null;
    let teamName: string | null = null;

    if (projectType === "Individual") {
      members = [
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Owner",
          photoURL: user.photoURL || "",
          role: "owner",
        },
      ];
      memberIds = [user.uid];
    } else {
      const selectedTeam = getSelectedTeam();

      if (!selectedTeam) {
        setError("Te rog să selectezi o echipă pentru proiectul de echipă.");
        return;
      }

      members = selectedTeam.members;
      memberIds = selectedTeam.memberIds;
      teamId = selectedTeam.id;
      teamName = selectedTeam.name;
    }

    try {
      if (isEditMode && selectedProjectId) {
        const existingProject = projects.find(
          (project) => project.id === selectedProjectId,
        );

        await updateDoc(doc(db, "projects", selectedProjectId), {
          name: projectName.trim(),
          client: client.trim(),
          type: projectType,
          status,
          deadline,
          description: description.trim(),
          teamId,
          teamName,
          memberIds,
          members,
          ownerId: existingProject?.ownerId || user.uid,
          ownerDisplayName:
            existingProject?.ownerDisplayName || user.displayName || "Owner",
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
          ownerDisplayName: user.displayName || "Owner",
          teamId,
          teamName,
          memberIds,
          members,
          createdAt: serverTimestamp(),
        });
      }

      await fetchProjects();
      closeModal();
    } catch (saveError) {
      console.error("Eroare la salvarea proiectului:", saveError);
      setError("A apărut o eroare la salvarea proiectului.");
    }
  }

  async function handleDeleteProject(projectId: string) {
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setOpenMenuId(null);
    } catch (deleteError) {
      console.error("Eroare la ștergerea proiectului:", deleteError);
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

  function getMemberInitial(name: string) {
    return name?.trim()?.charAt(0)?.toUpperCase() || "U";
  }

  return (
    <div className="projects-page">
      <div className="projects-page-header">
        <div className="projects-page-header-text">
          <h1 className="projects-page-title">Proiecte</h1>
          <p className="projects-page-subtitle">
            Creează proiecte individuale sau de echipă și organizează
            activitatea într-un mod clar.
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
            {projects.map((project) => {
              const isOwner = project.ownerId === user?.uid;

              return (
                <div className="project-card" key={project.id}>
                  <div className="project-card-top">
                    <div className="project-card-title-section">
                      <h2 className="project-card-title">{project.name}</h2>
                      <p className="project-card-client">{project.client}</p>
                    </div>

                    {isOwner && (
                      <div
                        className="project-card-actions"
                        ref={menuWrapperRef}
                      >
                        <button
                          type="button"
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
                            <button
                              type="button"
                              onClick={() => openEditModal(project)}
                            >
                              Editează
                            </button>
                            <button
                              type="button"
                              className="delete-action"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              Șterge
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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

                    {project.type === "De echipă" && (
                      <div className="project-card-info-item">
                        <span className="label">Echipă</span>
                        <span className="value">{project.teamName || "-"}</span>
                      </div>
                    )}

                    <div className="project-card-info-item">
                      <span className="label">Owner</span>
                      <span className="value">{project.ownerDisplayName}</span>
                    </div>

                    <div className="project-card-info-item">
                      <span className="label">Deadline</span>
                      <span className="value">
                        {formatDateForInput(project.deadline)}
                      </span>
                    </div>

                    <div className="project-card-info-item">
                      <span className="label">Membri</span>
                      <span className="value">{project.memberIds.length}</span>
                    </div>
                  </div>

                  <div className="project-card-description">
                    {project.description || "Fără descriere disponibilă."}
                  </div>

                  <div className="project-card-members">
                    {project.members.slice(0, 4).map((member) => (
                      <div
                        className="project-card-member-avatar"
                        key={member.uid}
                        title={member.displayName}
                      >
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} />
                        ) : (
                          <span>{getMemberInitial(member.displayName)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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

              <button
                type="button"
                className="projects-modal-close"
                onClick={closeModal}
              >
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
                      setProjectType(e.target.value as ProjectKind)
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

              {projectType === "De echipă" && (
                <div className="projects-form-group">
                  <label htmlFor="selectedTeam">Echipă</label>
                  <select
                    id="selectedTeam"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={teamsLoading}
                  >
                    <option value="">
                      {teamsLoading
                        ? "Se încarcă echipele..."
                        : ownedTeams.length > 0
                          ? "Selectează o echipă"
                          : "Nu ai nicio echipă unde ești owner"}
                    </option>

                    {ownedTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  <span className="projects-form-note">
                    Pentru proiectele de echipă poți selecta doar echipele unde
                    ești owner.
                  </span>
                </div>
              )}

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
                  {isEditMode ? "Salvează" : "Salvează"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
