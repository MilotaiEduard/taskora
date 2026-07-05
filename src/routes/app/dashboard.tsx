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
import { FaFilePdf, FaFileCsv } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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
  type: "Individual" | "De echipă";
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
  projectId: string;
  projectName: string;
  projectType?: "Individual" | "De echipă";
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

type TeamMember = {
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
  ownerDisplayName: string;
  members: TeamMember[];
  memberIds: string[];
};

type MemberTaskStats = {
  memberId: string;
  memberName: string;
  completedTasks: number;
  totalAssigned: number;
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
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

  // Funcție pentru a înlocui diacriticele românești
  function removeDiacritics(text: string) {
    return text
      .replace(/ă/g, "a")
      .replace(/Ă/g, "A")
      .replace(/â/g, "a")
      .replace(/Â/g, "A")
      .replace(/î/g, "i")
      .replace(/Î/g, "I")
      .replace(/ș/g, "s")
      .replace(/Ș/g, "S")
      .replace(/ț/g, "t")
      .replace(/Ț/g, "T")
      .replace(/ț/g, "t")
      .replace(/Ț/g, "T");
  }

  // Funcții pentru export
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Titlu cu culoarea specificată
    doc.setFontSize(20);
    doc.setTextColor(29, 152, 241); // #1d98f1
    doc.text(removeDiacritics("Raport Dashboard Taskora"), 20, 20);

    // Data generării
    doc.setTextColor(0, 0, 0); // Reset la negru
    doc.setFontSize(10);
    doc.text(`Generat la: ${new Date().toLocaleString("ro-RO")}`, 20, 30);

    let yPosition = 45;

    // Statistici generale
    doc.setFontSize(14);
    doc.setTextColor(29, 152, 241); // #1d98f1
    doc.text(removeDiacritics("Statistici generale"), 20, yPosition);
    doc.setTextColor(0, 0, 0); // Reset la negru
    yPosition += 10;

    const statsData = [
      ["Metrica", "Valoare"],
      [removeDiacritics("Proiecte totale"), projectStats.total.toString()],
      [
        removeDiacritics("Proiecte planificate"),
        projectStats.planned.toString(),
      ],
      [
        removeDiacritics("Proiecte in lucru"),
        projectStats.inProgress.toString(),
      ],
      [
        removeDiacritics("Proiecte finalizate"),
        projectStats.completed.toString(),
      ],
      [removeDiacritics("Task-uri totale"), taskStats.total.toString()],
      [removeDiacritics("Task-uri de facut"), taskStats.todo.toString()],
      [removeDiacritics("Task-uri in lucru"), taskStats.inProgress.toString()],
      [removeDiacritics("Task-uri finalizate"), taskStats.completed.toString()],
      [
        removeDiacritics("Newslettere totale"),
        newsletterStats.total.toString(),
      ],
      [
        removeDiacritics("Newslettere de facut"),
        newsletterStats.todo.toString(),
      ],
      [
        removeDiacritics("Newslettere in lucru"),
        newsletterStats.inProgress.toString(),
      ],
      [
        removeDiacritics("Newslettere finalizate"),
        newsletterStats.completed.toString(),
      ],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: "grid",
      headStyles: {
        fillColor: [29, 152, 241], // #1d98f1 pentru header
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Culoare alternativă pentru rânduri
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Proiecte
    if (projects.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(29, 152, 241); // #1d98f1
      doc.text("Proiecte", 20, yPosition);
      doc.setTextColor(0, 0, 0); // Reset la negru
      yPosition += 10;

      const projectsData = [
        ["Nume proiect", "Status", "Deadline", "Membri"],
        ...projects.map((project) => [
          removeDiacritics(project.name),
          removeDiacritics(project.status),
          formatDate(project.deadline),
          project.memberIds.length.toString(),
        ]),
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [projectsData[0]],
        body: projectsData.slice(1),
        theme: "grid",
        headStyles: {
          fillColor: [29, 152, 241], // #1d98f1 pentru header
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Culoare alternativă pentru rânduri
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Task-uri
    if (tasks.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(29, 152, 241); // #1d98f1
      doc.text("Task-uri", 20, yPosition);
      doc.setTextColor(0, 0, 0); // Reset la negru
      yPosition += 10;

      const tasksData = [
        ["Titlu", "Status", "Deadline", "Proiect"],
        ...tasks.map((task) => [
          removeDiacritics(task.title),
          removeDiacritics(task.status),
          formatDate(task.deadline),
          removeDiacritics(task.projectName),
        ]),
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [tasksData[0]],
        body: tasksData.slice(1),
        theme: "grid",
        headStyles: {
          fillColor: [29, 152, 241], // #1d98f1 pentru header
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Culoare alternativă pentru rânduri
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Newslettere
    if (newsletters.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(29, 152, 241); // #1d98f1
      doc.text("Newslettere", 20, yPosition);
      doc.setTextColor(0, 0, 0); // Reset la negru
      yPosition += 10;

      const newslettersData = [
        ["Nume", "Client", "Status", "Deadline"],
        ...newsletters.map((newsletter) => [
          removeDiacritics(newsletter.creationName),
          removeDiacritics(newsletter.client),
          removeDiacritics(newsletter.status),
          formatDate(newsletter.deadline),
        ]),
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [newslettersData[0]],
        body: newslettersData.slice(1),
        theme: "grid",
        headStyles: {
          fillColor: [29, 152, 241], // #1d98f1 pentru header
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Culoare alternativă pentru rânduri
        },
      });
    }

    // Salvează PDF-ul
    doc.save(`dashboard-taskora-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToExcel = () => {
    // Creează workbook-ul Excel
    const wb = XLSX.utils.book_new();

    // Statistici generale
    const statsData = [
      ["Tip", "Total", "In lucru", "Finalizate"],
      [
        "Proiecte",
        projectStats.total,
        projectStats.inProgress,
        projectStats.completed,
      ],
      ["Task-uri", taskStats.total, taskStats.inProgress, taskStats.completed],
      [
        "Newslettere",
        newsletterStats.total,
        newsletterStats.inProgress,
        newsletterStats.completed,
      ],
    ];

    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, "Statistici Generale");

    // Proiecte
    if (projects.length > 0) {
      const projectsData = [
        ["Nume Proiect", "Status", "Deadline", "Numar Membri"],
        ...projects.map((project) => [
          project.name,
          project.status,
          formatDate(project.deadline),
          project.memberIds.length,
        ]),
      ];

      const wsProjects = XLSX.utils.aoa_to_sheet(projectsData);
      XLSX.utils.book_append_sheet(wb, wsProjects, "Proiecte");
    }

    // Task-uri
    if (tasks.length > 0) {
      const tasksData = [
        ["Titlu", "Status", "Deadline", "Proiect"],
        ...tasks.map((task) => [
          task.title,
          task.status,
          formatDate(task.deadline),
          task.projectName,
        ]),
      ];

      const wsTasks = XLSX.utils.aoa_to_sheet(tasksData);
      XLSX.utils.book_append_sheet(wb, wsTasks, "Task-uri");
    }

    // Newslettere
    if (newsletters.length > 0) {
      const newslettersData = [
        ["Nume", "Client", "Status", "Deadline"],
        ...newsletters.map((newsletter) => [
          newsletter.creationName,
          newsletter.client,
          newsletter.status,
          formatDate(newsletter.deadline),
        ]),
      ];

      const wsNewsletters = XLSX.utils.aoa_to_sheet(newslettersData);
      XLSX.utils.book_append_sheet(wb, wsNewsletters, "Newslettere");
    }

    // Deadline-uri apropiate
    if (urgentDeadlines.length > 0) {
      const deadlinesData = [
        ["Nume", "Tip", "Deadline", "Detalii"],
        ...urgentDeadlines.map((deadline) => [
          deadline.name,
          deadline.type,
          formatDate(deadline.deadline),
          deadline.extra || "",
        ]),
      ];

      const wsDeadlines = XLSX.utils.aoa_to_sheet(deadlinesData);
      XLSX.utils.book_append_sheet(wb, wsDeadlines, "Deadline-uri Apropiate");
    }

    // Generează și descarcă fișierul Excel
    XLSX.writeFile(
      wb,
      `dashboard-taskora-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

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

        const teamsQuery = query(
          collection(db, "teams"),
          where("memberIds", "array-contains", user.uid),
        );

        const [
          projectsSnapshot,
          tasksSnapshot,
          newslettersSnapshot,
          teamsSnapshot,
        ] = await Promise.all([
          getDocs(projectsQuery),
          getDocs(tasksQuery),
          getDocs(newslettersQuery),
          getDocs(teamsQuery),
        ]);

        const fetchedProjects: ProjectData[] = projectsSnapshot.docs.map(
          (docItem) => ({
            id: docItem.id,
            name: docItem.data().name,
            type: docItem.data().type || "Individual",
            status: docItem.data().status,
            deadline: docItem.data().deadline,
            memberIds: docItem.data().memberIds || [],
          }),
        );

        const fetchedTasks: TaskData[] = tasksSnapshot.docs
          .map((docItem) => {
            const projectId = docItem.data().projectId;
            const projectData = fetchedProjects.find((p) => p.id === projectId);

            return {
              id: docItem.id,
              title: docItem.data().title,
              status: docItem.data().status,
              deadline: docItem.data().deadline,
              assigneeId: docItem.data().assigneeId,
              creatorId: docItem.data().creatorId,
              projectId,
              projectName: docItem.data().projectName,
              projectType: projectData?.type,
            };
          })
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

        const fetchedTeams: TeamData[] = teamsSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          name: docItem.data().name,
          ownerId: docItem.data().ownerId,
          ownerDisplayName: docItem.data().ownerDisplayName || "Owner",
          members: docItem.data().members || [],
          memberIds: docItem.data().memberIds || [],
        }));

        setProjects(fetchedProjects);
        setTasks(fetchedTasks);
        setNewsletters(fetchedNewsletters);
        setTeams(fetchedTeams);
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
      ...newsletters
        .filter((newsletter) => newsletter.status !== "Finalizat")
        .map((newsletter) => ({
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

  const teamPerformanceData = useMemo(() => {
    return teams.map((team) => {
      // Filtrez task-urile asignate membrilor echipei și din proiectele de echipă
      const teamTasks = tasks.filter(
        (task) =>
          team.memberIds.includes(task.assigneeId) &&
          task.projectType === "De echipă",
      );

      // Grupez pe assignee și calculez statistici
      const memberStats = new Map<string, MemberTaskStats>();

      teamTasks.forEach((task) => {
        const stats = memberStats.get(task.assigneeId) || {
          memberId: task.assigneeId,
          memberName:
            team.members.find((m) => m.uid === task.assigneeId)?.displayName ||
            "Unknown",
          completedTasks: 0,
          totalAssigned: 0,
        };

        stats.totalAssigned += 1;
        if (task.status === "Finalizat") {
          stats.completedTasks += 1;
        }

        memberStats.set(task.assigneeId, stats);
      });

      return {
        teamId: team.id,
        teamName: team.name,
        data: Array.from(memberStats.values()).sort(
          (a, b) => b.completedTasks - a.completedTasks,
        ),
      };
    });
  }, [teams, tasks]);

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
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              O privire de ansamblu asupra proiectelor, task-urilor și
              newsletterelor.
            </p>
          </div>
          <div className="dashboard-export-buttons">
            <button
              className="dashboard-export-button dashboard-export-pdf"
              onClick={exportToPDF}
              title="Exportă ca PDF"
            >
              <FaFilePdf />
              <span>Export PDF</span>
            </button>
            <button
              className="dashboard-export-button dashboard-export-csv"
              onClick={exportToExcel}
              title="Exportă ca Excel"
            >
              <FaFileCsv />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
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

      {teamPerformanceData.length > 0 && (
        <div className="dashboard-team-performance">
          <div className="dashboard-section-title">
            <h2>Performanța Echipelor</h2>
            <p>Task-uri finalizate de fiecare membru echipă</p>
          </div>

          <div className="dashboard-team-charts-grid">
            {teamPerformanceData.map((team) =>
              team.data.length > 0 ? (
                <div className="dashboard-chart-card" key={team.teamId}>
                  <div className="dashboard-card-header">
                    <h3>{team.teamName}</h3>
                  </div>

                  <div className="dashboard-chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={team.data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          dataKey="memberName"
                          type="category"
                          width={190}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                          }}
                          formatter={(value) => value}
                          labelFormatter={(label) => `Membru: ${label}`}
                        />
                        <Bar
                          dataKey="completedTasks"
                          fill="#22c55e"
                          name="Finalizate"
                          radius={[0, 8, 8, 0]}
                        />
                        <Bar
                          dataKey="totalAssigned"
                          fill="#e5e7eb"
                          name="Total atribuite"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="dashboard-team-stats">
                    {team.data.map((member) => (
                      <div
                        className="dashboard-team-member-stat"
                        key={member.memberId}
                      >
                        <span className="dashboard-team-member-name">
                          {member.memberName}
                        </span>
                        <div className="dashboard-team-member-progress">
                          <span className="dashboard-team-member-completed">
                            {member.completedTasks}
                          </span>
                          <span className="dashboard-team-member-divider">
                            /
                          </span>
                          <span className="dashboard-team-member-total">
                            {member.totalAssigned}
                          </span>
                          <span className="dashboard-team-member-percentage">
                            (
                            {member.totalAssigned > 0
                              ? Math.round(
                                  (member.completedTasks /
                                    member.totalAssigned) *
                                    100,
                                )
                              : 0}
                            %)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

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
