import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { auth, db } from "../../firebase/firebase";

export const Route = createFileRoute("/app/calendar")({
  component: RouteComponent,
});

type ProjectData = {
  id: string;
  name: string;
  deadline: string;
  memberIds: string[];
};

type TaskData = {
  id: string;
  title: string;
  deadline: string;
  assigneeId: string;
  creatorId: string;
};

type NewsletterData = {
  id: string;
  creationName: string;
  deadline: string;
  ownerId: string;
};

type CalendarEventType = {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  className: string;
};

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

  useEffect(() => {
    async function fetchCalendarData() {
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

        const fetchedProjects: ProjectData[] = projectsSnapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            name: docItem.data().name,
            deadline: docItem.data().deadline,
            memberIds: docItem.data().memberIds || [],
          }))
          .filter((project) => Boolean(project.deadline));

        const fetchedTasks: TaskData[] = tasksSnapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            title: docItem.data().title,
            deadline: docItem.data().deadline,
            assigneeId: docItem.data().assigneeId,
            creatorId: docItem.data().creatorId,
          }))
          .filter(
            (task) =>
              Boolean(task.deadline) &&
              (task.assigneeId === user.uid || task.creatorId === user.uid),
          );

        const fetchedNewsletters: NewsletterData[] = newslettersSnapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            creationName: docItem.data().creationName,
            deadline: docItem.data().deadline,
            ownerId: docItem.data().ownerId,
          }))
          .filter((newsletter) => Boolean(newsletter.deadline));

        setProjects(fetchedProjects);
        setTasks(fetchedTasks);
        setNewsletters(fetchedNewsletters);
      } catch (error) {
        console.error("Eroare la încărcarea calendarului:", error);
        setProjects([]);
        setTasks([]);
        setNewsletters([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCalendarData();
  }, [user]);

  const events: CalendarEventType[] = useMemo(() => {
    const projectEvents: CalendarEventType[] = projects.map((project) => ({
      id: `project-${project.id}`,
      title: `Proiect: ${project.name}`,
      start: project.deadline,
      allDay: true,
      className: "fc-event-project",
    }));

    const taskEvents: CalendarEventType[] = tasks.map((task) => ({
      id: `task-${task.id}`,
      title: `Task: ${task.title}`,
      start: task.deadline,
      allDay: true,
      className: "fc-event-task",
    }));

    const newsletterEvents: CalendarEventType[] = newsletters.map(
      (newsletter) => ({
        id: `newsletter-${newsletter.id}`,
        title: `Newsletter: ${newsletter.creationName}`,
        start: newsletter.deadline,
        allDay: true,
        className: "fc-event-newsletter",
      }),
    );

    return [...projectEvents, ...taskEvents, ...newsletterEvents];
  }, [projects, tasks, newsletters]);

  return (
    <div className="calendar-page">
      <div className="calendar-page-header">
        <h1 className="calendar-page-title">Calendar</h1>
        <p className="calendar-page-subtitle">
          Vizualizează rapid deadline-urile importante pentru proiecte, task-uri
          și newslettere.
        </p>
      </div>

      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot project"></span>
          <span>Proiecte</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot task"></span>
          <span>Task-uri</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot newsletter"></span>
          <span>Newslettere</span>
        </div>
      </div>

      <div className="calendar-wrapper">
        {loading ? (
          <div className="calendar-loading">Se încarcă evenimentele...</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            locale="ro"
            height="auto"
            events={events}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            buttonText={{
              today: "Astăzi",
            }}
            dayMaxEvents={3}
            moreLinkText={(num) => `+ încă ${num}`}
          />
        )}
      </div>
    </div>
  );
}
