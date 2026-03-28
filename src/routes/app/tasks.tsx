import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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

export const Route = createFileRoute("/app/tasks")({
  component: RouteComponent,
});

type TaskStatus = "De făcut" | "În lucru" | "Finalizat";
type TaskPriority = "Scăzută" | "Medie" | "Ridicată";

type ProjectMember = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "owner" | "member";
};

type ProjectData = {
  id: string;
  name: string;
  type: "Individual" | "De echipă";
  ownerId: string;
  ownerDisplayName: string;
  memberIds: string[];
  members: ProjectMember[];
};

type TaskData = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  creatorId: string;
  creatorName: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
};

type TaskView = "atribuiteMie" | "createDeMine";

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [activeView, setActiveView] = useState<TaskView>("atribuiteMie");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("De făcut");
  const [priority, setPriority] = useState<TaskPriority>("Medie");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  async function fetchProjects() {
    if (!user) {
      setProjects([]);
      setProjectsLoading(false);
      return;
    }

    try {
      setProjectsLoading(true);

      const projectsRef = collection(db, "projects");
      const q = query(
        projectsRef,
        where("memberIds", "array-contains", user.uid),
      );
      const snapshot = await getDocs(q);

      const fetchedProjects: ProjectData[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        name: docItem.data().name,
        type: docItem.data().type,
        ownerId: docItem.data().ownerId,
        ownerDisplayName: docItem.data().ownerDisplayName || "Owner",
        memberIds: docItem.data().memberIds || [],
        members: docItem.data().members || [],
      }));

      setProjects(fetchedProjects);
    } catch (fetchError) {
      console.error("Eroare la încărcarea proiectelor:", fetchError);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }

  async function fetchTasks() {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const tasksRef = collection(db, "tasks");
      const snapshot = await getDocs(tasksRef);

      const fetchedTasks: TaskData[] = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          title: docItem.data().title,
          description: docItem.data().description,
          projectId: docItem.data().projectId,
          projectName: docItem.data().projectName,
          assigneeId: docItem.data().assigneeId,
          assigneeName: docItem.data().assigneeName,
          creatorId: docItem.data().creatorId,
          creatorName: docItem.data().creatorName,
          status: docItem.data().status,
          priority: docItem.data().priority,
          deadline: docItem.data().deadline,
          createdAt: docItem.data().createdAt,
        }))
        .filter(
          (task) => task.assigneeId === user.uid || task.creatorId === user.uid,
        );

      fetchedTasks.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds || 0;
        const bSeconds = b.createdAt?.seconds || 0;
        return bSeconds - aSeconds;
      });

      setTasks(fetchedTasks);
    } catch (fetchError) {
      console.error("Eroare la încărcarea task-urilor:", fetchError);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchTasks();
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

  const filteredTasks = useMemo(() => {
    if (!user) return [];

    if (activeView === "atribuiteMie") {
      return tasks.filter((task) => task.assigneeId === user.uid);
    }

    return tasks.filter((task) => task.creatorId === user.uid);
  }, [activeView, tasks, user]);

  function resetForm() {
    setTaskTitle("");
    setTaskDescription("");
    setSelectedProjectId("");
    setSelectedAssigneeId("");
    setStatus("De făcut");
    setPriority("Medie");
    setDeadline("");
    setError("");
    setSelectedTaskId(null);
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

  function getSelectedProject() {
    return projects.find((project) => project.id === selectedProjectId) || null;
  }

  const selectedProject = getSelectedProject();
  const isSelectedProjectOwner = selectedProject?.ownerId === user?.uid;

  const availableAssignees = useMemo(() => {
    if (!selectedProject || !user) return [];

    if (selectedProject.type === "Individual") {
      return selectedProject.members.filter(
        (member) => member.uid === user.uid,
      );
    }

    if (isSelectedProjectOwner) {
      return selectedProject.members;
    }

    return selectedProject.members.filter((member) => member.uid === user.uid);
  }, [selectedProject, user, isSelectedProjectOwner]);

  useEffect(() => {
    if (!selectedProject || !user) {
      setSelectedAssigneeId("");
      return;
    }

    if (selectedProject.type === "Individual") {
      setSelectedAssigneeId(user.uid);
      return;
    }

    if (isSelectedProjectOwner) {
      return;
    }

    setSelectedAssigneeId(user.uid);
  }, [selectedProjectId, selectedProject, user, isSelectedProjectOwner]);

  function openEditModal(task: TaskData) {
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setSelectedProjectId(task.projectId);
    setSelectedAssigneeId(task.assigneeId);
    setStatus(task.status);
    setPriority(task.priority);
    setDeadline(task.deadline);
    setSelectedTaskId(task.id);
    setIsEditMode(true);
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  async function handleSaveTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Trebuie să fii autentificat pentru a salva un task.");
      return;
    }

    if (
      !taskTitle.trim() ||
      !selectedProjectId.trim() ||
      !selectedAssigneeId.trim() ||
      !deadline.trim()
    ) {
      setError("Te rog să completezi toate câmpurile obligatorii.");
      return;
    }

    const project = projects.find((item) => item.id === selectedProjectId);

    if (!project) {
      setError("Proiectul selectat nu este valid.");
      return;
    }

    const assignee = project.members.find(
      (member) => member.uid === selectedAssigneeId,
    );

    if (!assignee) {
      setError("Persoana selectată pentru atribuire nu este validă.");
      return;
    }

    try {
      if (isEditMode && selectedTaskId) {
        await updateDoc(doc(db, "tasks", selectedTaskId), {
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          projectId: project.id,
          projectName: project.name,
          assigneeId: assignee.uid,
          assigneeName: assignee.displayName,
          status,
          priority,
          deadline,
        });
      } else {
        await addDoc(collection(db, "tasks"), {
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          projectId: project.id,
          projectName: project.name,
          assigneeId: assignee.uid,
          assigneeName: assignee.displayName,
          creatorId: user.uid,
          creatorName: user.displayName || "Utilizator",
          status,
          priority,
          deadline,
          createdAt: serverTimestamp(),
        });
      }

      await fetchTasks();
      closeModal();
    } catch (saveError) {
      console.error("Eroare la salvarea task-ului:", saveError);
      setError("A apărut o eroare la salvarea task-ului.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setOpenMenuId(null);
    } catch (deleteError) {
      console.error("Eroare la ștergerea task-ului:", deleteError);
    }
  }

  function getStatusClass(taskStatus: TaskStatus) {
    switch (taskStatus) {
      case "De făcut":
        return "todo";
      case "În lucru":
        return "in-progress";
      case "Finalizat":
        return "completed";
      default:
        return "";
    }
  }

  function getPriorityClass(taskPriority: TaskPriority) {
    switch (taskPriority) {
      case "Scăzută":
        return "low";
      case "Medie":
        return "medium";
      case "Ridicată":
        return "high";
      default:
        return "";
    }
  }

  return (
    <div className="tasks-page">
      <div className="tasks-page-header">
        <div className="tasks-page-header-text">
          <h1 className="tasks-page-title">Task-urile mele</h1>
          <p className="tasks-page-subtitle">
            Gestionează task-urile atribuite ție și pe cele create de tine.
          </p>
        </div>

        <button className="tasks-create-button" onClick={openCreateModal}>
          <MdOutlineAdd />
          Creează task
        </button>
      </div>

      <div className="tasks-view-switcher">
        <button
          type="button"
          className={activeView === "atribuiteMie" ? "active" : ""}
          onClick={() => setActiveView("atribuiteMie")}
        >
          Atribuite mie
        </button>

        <button
          type="button"
          className={activeView === "createDeMine" ? "active" : ""}
          onClick={() => setActiveView("createDeMine")}
        >
          Create de mine
        </button>
      </div>

      <div className="tasks-page-content">
        {loading ? (
          <div className="tasks-empty-state">
            <h2>Se încarcă task-urile...</h2>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="tasks-grid">
            {filteredTasks.map((task) => (
              <div className="task-card" key={task.id}>
                <div className="task-card-top">
                  <div className="task-card-title-section">
                    <h2 className="task-card-title">{task.title}</h2>
                    <p className="task-card-project">{task.projectName}</p>
                  </div>

                  <div className="task-card-actions" ref={menuWrapperRef}>
                    <button
                      type="button"
                      className="task-card-menu-button"
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === task.id ? null : task.id,
                        )
                      }
                    >
                      <IoEllipsisHorizontal />
                    </button>

                    {openMenuId === task.id && (
                      <div className="task-card-menu">
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                        >
                          Editează
                        </button>
                        <button
                          type="button"
                          className="delete-action"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Șterge
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="task-card-badges">
                  <div
                    className={`task-card-status ${getStatusClass(task.status)}`}
                  >
                    {task.status}
                  </div>

                  <div
                    className={`task-card-priority ${getPriorityClass(task.priority)}`}
                  >
                    {task.priority}
                  </div>
                </div>

                <div className="task-card-info">
                  <div className="task-card-info-item">
                    <span className="label">Atribuit către</span>
                    <span className="value">{task.assigneeName}</span>
                  </div>

                  <div className="task-card-info-item">
                    <span className="label">Creat de</span>
                    <span className="value">{task.creatorName}</span>
                  </div>

                  <div className="task-card-info-item">
                    <span className="label">Deadline</span>
                    <span className="value">{formatDate(task.deadline)}</span>
                  </div>
                </div>

                <div className="task-card-description">
                  {task.description || "Fără descriere disponibilă."}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tasks-empty-state">
            <h2>Nu există task-uri momentan</h2>
            <p>
              Creează primul tău task pentru a începe organizarea activității.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="tasks-modal-overlay" onClick={closeModal}>
          <div className="tasks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tasks-modal-header">
              <div>
                <h2>{isEditMode ? "Editează task" : "Creează task"}</h2>
                <p>
                  {isEditMode
                    ? "Actualizează informațiile task-ului."
                    : "Completează informațiile de bază ale task-ului."}
                </p>
              </div>

              <button
                type="button"
                className="tasks-modal-close"
                onClick={closeModal}
              >
                <IoClose />
              </button>
            </div>

            <form className="tasks-form" onSubmit={handleSaveTask}>
              <div className="tasks-form-group">
                <label htmlFor="taskTitle">Titlu task</label>
                <input
                  id="taskTitle"
                  type="text"
                  placeholder="Introdu titlul task-ului"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="tasks-form-group">
                <label htmlFor="selectedProject">Proiect</label>
                <select
                  id="selectedProject"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={projectsLoading}
                >
                  <option value="">
                    {projectsLoading
                      ? "Se încarcă proiectele..."
                      : projects.length > 0
                        ? "Selectează un proiect"
                        : "Nu există proiecte disponibile"}
                  </option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tasks-form-row">
                <div className="tasks-form-group">
                  <label htmlFor="assignee">Atribuit către</label>
                  <select
                    id="assignee"
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    disabled={!selectedProject}
                  >
                    <option value="">
                      {!selectedProject
                        ? "Selectează mai întâi un proiect"
                        : "Selectează o persoană"}
                    </option>

                    {availableAssignees.map((member) => (
                      <option key={member.uid} value={member.uid}>
                        {member.displayName}
                      </option>
                    ))}
                  </select>

                  {selectedProject?.type === "De echipă" &&
                    !isSelectedProjectOwner && (
                      <span className="tasks-form-note">
                        Nu ești owner-ul acestui proiect, deci poți atribui
                        task-ul doar ție.
                      </span>
                    )}
                </div>

                <div className="tasks-form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  >
                    <option value="De făcut">De făcut</option>
                    <option value="În lucru">În lucru</option>
                    <option value="Finalizat">Finalizat</option>
                  </select>
                </div>
              </div>

              <div className="tasks-form-row">
                <div className="tasks-form-group">
                  <label htmlFor="priority">Prioritate</label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                  >
                    <option value="Scăzută">Scăzută</option>
                    <option value="Medie">Medie</option>
                    <option value="Ridicată">Ridicată</option>
                  </select>
                </div>

                <div className="tasks-form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="tasks-form-group">
                <label htmlFor="taskDescription">Descriere</label>
                <textarea
                  id="taskDescription"
                  placeholder="Adaugă o scurtă descriere a task-ului"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              {error && <div className="tasks-form-error">{error}</div>}

              <div className="tasks-form-actions">
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
