import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MdOutlineFolder,
  MdOutlineTaskAlt,
  MdOutlineMail,
  MdOutlineSchedule,
} from "react-icons/md";
import { auth, db } from "../../firebase/firebase";

export const Route = createFileRoute("/app/dashboard")({
  component: RouteComponent,
});

type ProjectStatus = "Planificat" | "În lucru" | "Finalizat";
type TaskStatus = "De făcut" | "În lucru" | "Finalizat";
type NewsletterStatus = "De făcut" | "În lucru" | "Finalizat";

type ProjectData = {
  id: string;
  name: string;
  status: ProjectStatus;
  deadline: string;
  memberIds: string[];
};

type TaskData = {
  id: string;
  title: string;
  status: TaskStatus;
  deadline: string;
  assigneeId: string;
  creatorId: string;
  projectName: string;
};

type NewsletterData = {
  id: string;
  creationName: string;
  client: string;
  status: NewsletterStatus;
  deadline: string;
  ownerId: string;
};

type DeadlineItem = {
  id: string;
  name: string;
  type: "Proiect" | "Task" | "Newsletter";
  deadline: string;
  extra?: string;
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  function formatDate(dateString: string) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;

    return `${day}-${month}-${year}`;
  }

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setProjects([]);
        setTasks([]);
        setNewsletters([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const projectsQuery = query(
          collection(db, "projects"),
          where("memberIds", "array-contains", user.uid),
        );

        const tasksQuery = query(collection(db, "tasks"));
        const newslettersQuery = query(
          collection(db, "newsletters"),
          where("ownerId", "==", user.uid),
        );

        const [projectsSnapshot, tasksSnapshot, newslettersSnapshot] =
          await Promise.all([
            getDocs(projectsQuery),
            getDocs(tasksQuery),
            getDocs(newslettersQuery),
          ]);

        const fetchedProjects: ProjectData[] = projectsSnapshot.docs.map(
          (docItem) => ({
            id: docItem.id,
            name: docItem.data().name,
            status: docItem.data().status,
            deadline: docItem.data().deadline,
            memberIds: docItem.data().memberIds || [],
          }),
        );

        const fetchedTasks: TaskData[] = tasksSnapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            title: docItem.data().title,
            status: docItem.data().status,
            deadline: docItem.data().deadline,
            assigneeId: docItem.data().assigneeId,
            creatorId: docItem.data().creatorId,
            projectName: docItem.data().projectName,
          }))
          .filter(
            (task) =>
              task.assigneeId === user.uid || task.creatorId === user.uid,
          );

        const fetchedNewsletters: NewsletterData[] =
          newslettersSnapshot.docs.map((docItem) => ({
            id: docItem.id,
            creationName: docItem.data().creationName,
            client: docItem.data().client,
            status: docItem.data().status,
            deadline: docItem.data().deadline,
            ownerId: docItem.data().ownerId,
          }));

        setProjects(fetchedProjects);
        setTasks(fetchedTasks);
        setNewsletters(fetchedNewsletters);
      } catch (error) {
        console.error("Eroare la încărcarea dashboard-ului:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const projectsByStatus = useMemo(() => {
    return [
      {
        name: "Planificate",
        value: projects.filter((project) => project.status === "Planificat")
          .length,
      },
      {
        name: "În lucru",
        value: projects.filter((project) => project.status === "În lucru")
          .length,
      },
      {
        name: "Finalizate",
        value: projects.filter((project) => project.status === "Finalizat")
          .length,
      },
    ];
  }, [projects]);

  const tasksByStatus = useMemo(() => {
    return [
      {
        name: "De făcut",
        total: tasks.filter((task) => task.status === "De făcut").length,
      },
      {
        name: "În lucru",
        total: tasks.filter((task) => task.status === "În lucru").length,
      },
      {
        name: "Finalizate",
        total: tasks.filter((task) => task.status === "Finalizat").length,
      },
    ];
  }, [tasks]);

  const newslettersByClient = useMemo(() => {
    const grouped = newsletters.reduce<Record<string, number>>((acc, item) => {
      acc[item.client] = (acc[item.client] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, total]) => ({
      name,
      total,
    }));
  }, [newsletters]);

  const urgentDeadlines = useMemo(() => {
    const allItems: DeadlineItem[] = [
      ...projects.map((project) => ({
        id: project.id,
        name: project.name,
        type: "Proiect" as const,
        deadline: project.deadline,
      })),
      ...tasks.map((task) => ({
        id: task.id,
        name: task.title,
        type: "Task" as const,
        deadline: task.deadline,
        extra: task.projectName,
      })),
      ...newsletters.map((newsletter) => ({
        id: newsletter.id,
        name: newsletter.creationName,
        type: "Newsletter" as const,
        deadline: newsletter.deadline,
      })),
    ];

    return allItems
      .filter((item) => item.deadline)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 6);
  }, [projects, tasks, newsletters]);

  const projectStats = {
    total: projects.length,
    planned: projects.filter((project) => project.status === "Planificat")
      .length,
    inProgress: projects.filter((project) => project.status === "În lucru")
      .length,
    completed: projects.filter((project) => project.status === "Finalizat")
      .length,
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === "De făcut").length,
    inProgress: tasks.filter((task) => task.status === "În lucru").length,
    completed: tasks.filter((task) => task.status === "Finalizat").length,
  };

  const newsletterStats = {
    total: newsletters.length,
    todo: newsletters.filter((item) => item.status === "De făcut").length,
    inProgress: newsletters.filter((item) => item.status === "În lucru").length,
    completed: newsletters.filter((item) => item.status === "Finalizat").length,
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Se încarcă dashboard-ul...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          O privire de ansamblu asupra proiectelor, task-urilor și
          newsletterelor.
        </p>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <MdOutlineFolder />
          </div>
          <span className="dashboard-stat-label">Proiecte totale</span>
          <span className="dashboard-stat-value">{projectStats.total}</span>
          <span className="dashboard-stat-meta">
            {projectStats.inProgress} în lucru
          </span>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <MdOutlineTaskAlt />
          </div>
          <span className="dashboard-stat-label">Task-uri totale</span>
          <span className="dashboard-stat-value">{taskStats.total}</span>
          <span className="dashboard-stat-meta">{taskStats.todo} de făcut</span>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <MdOutlineMail />
          </div>
          <span className="dashboard-stat-label">Newslettere totale</span>
          <span className="dashboard-stat-value">{newsletterStats.total}</span>
          <span className="dashboard-stat-meta">
            {newsletterStats.inProgress} în lucru
          </span>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <MdOutlineSchedule />
          </div>
          <span className="dashboard-stat-label">Deadline-uri apropiate</span>
          <span className="dashboard-stat-value">{urgentDeadlines.length}</span>
          <span className="dashboard-stat-meta">următoarele elemente</span>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        <div className="dashboard-chart-card">
          <div className="dashboard-card-header">
            <h2>Proiecte după status</h2>
          </div>

          <div className="dashboard-chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={projectsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                >
                  {projectsByStatus.map((_, index) => (
                    <Cell
                      key={`project-status-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-card-header">
            <h2>Task-uri după status</h2>
          </div>

          <div className="dashboard-chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tasksByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-chart-card full-width">
          <div className="dashboard-card-header">
            <h2>Newslettere după client</h2>
          </div>

          <div className="dashboard-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newslettersByClient}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="dashboard-list-card">
          <div className="dashboard-card-header">
            <h2>Deadline-uri apropiate</h2>
          </div>

          {urgentDeadlines.length > 0 ? (
            <div className="dashboard-deadlines-list">
              {urgentDeadlines.map((item) => (
                <div
                  className="dashboard-deadline-item"
                  key={`${item.type}-${item.id}`}
                >
                  <div className="dashboard-deadline-main">
                    <span className="dashboard-deadline-name">{item.name}</span>
                    <span className="dashboard-deadline-type">{item.type}</span>
                  </div>

                  <div className="dashboard-deadline-meta">
                    {item.extra && <span>{item.extra}</span>}
                    <span>{formatDate(item.deadline)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-box">
              Nu există deadline-uri disponibile momentan.
            </div>
          )}
        </div>

        <div className="dashboard-list-card">
          <div className="dashboard-card-header">
            <h2>Rezumat rapid</h2>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-item">
              <span>Proiecte planificate</span>
              <strong>{projectStats.planned}</strong>
            </div>
            <div className="dashboard-summary-item">
              <span>Proiecte finalizate</span>
              <strong>{projectStats.completed}</strong>
            </div>
            <div className="dashboard-summary-item">
              <span>Task-uri în lucru</span>
              <strong>{taskStats.inProgress}</strong>
            </div>
            <div className="dashboard-summary-item">
              <span>Task-uri finalizate</span>
              <strong>{taskStats.completed}</strong>
            </div>
            <div className="dashboard-summary-item">
              <span>Newslettere de făcut</span>
              <strong>{newsletterStats.todo}</strong>
            </div>
            <div className="dashboard-summary-item">
              <span>Newslettere finalizate</span>
              <strong>{newsletterStats.completed}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
