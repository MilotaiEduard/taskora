import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IoClose } from "react-icons/io5";
import { MdDeleteOutline, MdEdit, MdOutlineAdd } from "react-icons/md";
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

export const Route = createFileRoute("/app/newsletters")({
  component: RouteComponent,
});

type NewsletterType = "Email" | "Rich SMS" | "Email + Rich SMS";
type NewsletterStatus = "De făcut" | "În lucru" | "Finalizat";

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
  members: TeamMember[];
};

type DeveloperOption = {
  uid: string;
  displayName: string;
  email: string;
};

type NewsletterData = {
  id: string;
  creationName: string;
  client: string;
  type: NewsletterType;
  status: NewsletterStatus;
  deadline: string;
  developerId: string;
  developerName: string;
  timeInMinutes: number;
  onlineLink: string;
  completedAt: string;
  ownerId: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
};

const ITEMS_PER_PAGE = 6;

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<
    string | null
  >(null);

  const [creationName, setCreationName] = useState("");
  const [client, setClient] = useState("Sephora");
  const [newsletterType, setNewsletterType] = useState<NewsletterType>("Email");
  const [status, setStatus] = useState<NewsletterStatus>("De făcut");
  const [deadline, setDeadline] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [timeInMinutes, setTimeInMinutes] = useState("");
  const [onlineLink, setOnlineLink] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  function normalizeUrl(url: string) {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  }

  function formatDate(dateString: string) {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }

  async function fetchTeams() {
    if (!user) {
      setTeams([]);
      setTeamsLoading(false);
      return;
    }

    try {
      setTeamsLoading(true);

      const teamsRef = collection(db, "teams");
      const q = query(teamsRef, where("memberIds", "array-contains", user.uid));
      const snapshot = await getDocs(q);

      const fetchedTeams: TeamData[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        name: docItem.data().name,
        members: docItem.data().members || [],
      }));

      setTeams(fetchedTeams);
    } catch (fetchError) {
      console.error("Eroare la încărcarea echipelor:", fetchError);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }

  async function fetchNewsletters() {
    if (!user) {
      setNewsletters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const newslettersRef = collection(db, "newsletters");
      const q = query(newslettersRef, where("ownerId", "==", user.uid));
      const snapshot = await getDocs(q);

      const fetchedNewsletters: NewsletterData[] = snapshot.docs.map(
        (docItem) => ({
          id: docItem.id,
          creationName: docItem.data().creationName,
          client: docItem.data().client,
          type: docItem.data().type,
          status: docItem.data().status,
          deadline: docItem.data().deadline,
          developerId: docItem.data().developerId,
          developerName: docItem.data().developerName,
          timeInMinutes: docItem.data().timeInMinutes,
          onlineLink: docItem.data().onlineLink,
          completedAt: docItem.data().completedAt,
          ownerId: docItem.data().ownerId,
          createdAt: docItem.data().createdAt,
        }),
      );

      fetchedNewsletters.sort((a, b) => {
        const aSeconds = a.createdAt?.seconds || 0;
        const bSeconds = b.createdAt?.seconds || 0;
        return bSeconds - aSeconds;
      });

      setNewsletters(fetchedNewsletters);
    } catch (fetchError) {
      console.error("Eroare la încărcarea newsletterelor:", fetchError);
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
    fetchNewsletters();
  }, [user]);

  const developerOptions = useMemo(() => {
    if (!user) return [];

    const map = new Map<string, DeveloperOption>();

    map.set(user.uid, {
      uid: user.uid,
      displayName: user.displayName || "Tu",
      email: user.email || "",
    });

    teams.forEach((team) => {
      team.members.forEach((member) => {
        if (!map.has(member.uid)) {
          map.set(member.uid, {
            uid: member.uid,
            displayName: member.displayName,
            email: member.email,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [teams, user]);

  const totalPages = Math.ceil(newsletters.length / ITEMS_PER_PAGE);

  const paginatedNewsletters = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return newsletters.slice(start, end);
  }, [newsletters, currentPage]);

  function resetForm() {
    setCreationName("");
    setClient("Sephora");
    setNewsletterType("Email");
    setStatus("De făcut");
    setDeadline("");
    setDeveloperId(user?.uid || "");
    setTimeInMinutes("");
    setOnlineLink("");
    setCompletedAt("");
    setError("");
    setSelectedNewsletterId(null);
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

  function openEditModal(newsletter: NewsletterData) {
    setCreationName(newsletter.creationName);
    setClient(newsletter.client);
    setNewsletterType(newsletter.type);
    setStatus(newsletter.status);
    setDeadline(newsletter.deadline);
    setDeveloperId(newsletter.developerId);
    setTimeInMinutes(String(newsletter.timeInMinutes));
    setOnlineLink(newsletter.onlineLink);
    setCompletedAt(newsletter.completedAt);
    setSelectedNewsletterId(newsletter.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  }

  async function handleSaveNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Trebuie să fii autentificat pentru a salva un newsletter.");
      return;
    }

    if (
      !creationName.trim() ||
      !client.trim() ||
      !deadline.trim() ||
      !developerId.trim() ||
      !timeInMinutes.trim()
    ) {
      setError("Te rog să completezi toate câmpurile obligatorii.");
      return;
    }

    const selectedDeveloper = developerOptions.find(
      (developer) => developer.uid === developerId,
    );

    if (!selectedDeveloper) {
      setError("Developer-ul selectat nu este valid.");
      return;
    }

    const parsedTime = Number(timeInMinutes);

    if (Number.isNaN(parsedTime) || parsedTime < 0) {
      setError("Timpul trebuie să fie un număr valid.");
      return;
    }

    try {
      if (isEditMode && selectedNewsletterId) {
        await updateDoc(doc(db, "newsletters", selectedNewsletterId), {
          creationName: creationName.trim(),
          client: client.trim(),
          type: newsletterType,
          status,
          deadline,
          developerId: selectedDeveloper.uid,
          developerName: selectedDeveloper.displayName,
          timeInMinutes: parsedTime,
          onlineLink: onlineLink.trim(),
          completedAt,
        });
      } else {
        await addDoc(collection(db, "newsletters"), {
          creationName: creationName.trim(),
          client: client.trim(),
          type: newsletterType,
          status,
          deadline,
          developerId: selectedDeveloper.uid,
          developerName: selectedDeveloper.displayName,
          timeInMinutes: parsedTime,
          onlineLink: onlineLink.trim(),
          completedAt,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      await fetchNewsletters();
      setCurrentPage(1);
      closeModal();
    } catch (saveError) {
      console.error("Eroare la salvarea newsletterului:", saveError);
      setError("A apărut o eroare la salvarea newsletterului.");
    }
  }

  async function handleDeleteNewsletter(newsletterId: string) {
    try {
      await deleteDoc(doc(db, "newsletters", newsletterId));
      const updatedNewsletters = newsletters.filter(
        (newsletter) => newsletter.id !== newsletterId,
      );
      setNewsletters(updatedNewsletters);

      const updatedTotalPages = Math.max(
        1,
        Math.ceil(updatedNewsletters.length / ITEMS_PER_PAGE),
      );

      if (currentPage > updatedTotalPages) {
        setCurrentPage(updatedTotalPages);
      }
    } catch (deleteError) {
      console.error("Eroare la ștergerea newsletterului:", deleteError);
    }
  }

  function getStatusClass(newsletterStatus: NewsletterStatus) {
    switch (newsletterStatus) {
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

  return (
    <div className="newsletters-page">
      <div className="newsletters-page-header">
        <div className="newsletters-page-header-text">
          <h1 className="newsletters-page-title">Newslettere</h1>
          <p className="newsletters-page-subtitle">
            Ține evidența creațiilor și organizează newsletterele într-un tabel
            clar și ușor de urmărit.
          </p>
        </div>

        <button className="newsletters-create-button" onClick={openCreateModal}>
          <MdOutlineAdd />
          Adaugă newsletter
        </button>
      </div>

      <div className="newsletters-page-content">
        {loading ? (
          <div className="newsletters-empty-state">
            <h2>Se încarcă newsletterele...</h2>
          </div>
        ) : newsletters.length > 0 ? (
          <>
            <div className="newsletters-table-wrapper">
              <table className="newsletters-table">
                <thead>
                  <tr>
                    <th>Nume creație</th>
                    <th>Client</th>
                    <th>Tip</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Developer</th>
                    <th>Timp</th>
                    <th>Link online</th>
                    <th>Data finalizare</th>
                    <th>Acțiuni</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedNewsletters.map((newsletter) => (
                    <tr key={newsletter.id}>
                      <td>{newsletter.creationName}</td>
                      <td>{newsletter.client}</td>
                      <td>{newsletter.type}</td>
                      <td>
                        <span
                          className={`newsletter-status ${getStatusClass(newsletter.status)}`}
                        >
                          {newsletter.status}
                        </span>
                      </td>
                      <td>{formatDate(newsletter.deadline)}</td>
                      <td>{newsletter.developerName}</td>
                      <td>{newsletter.timeInMinutes} min</td>
                      <td>
                        {newsletter.onlineLink ? (
                          <a
                            href={normalizeUrl(newsletter.onlineLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Vezi link
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{formatDate(newsletter.completedAt)}</td>
                      <td>
                        <div className="newsletter-actions">
                          <button
                            type="button"
                            className="newsletter-icon-button edit-button"
                            onClick={() => openEditModal(newsletter)}
                            aria-label="Editează newsletter"
                            title="Editează"
                          >
                            <MdEdit />
                          </button>

                          <button
                            type="button"
                            className="newsletter-icon-button delete-button"
                            onClick={() =>
                              handleDeleteNewsletter(newsletter.id)
                            }
                            aria-label="Șterge newsletter"
                            title="Șterge"
                          >
                            <MdDeleteOutline />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="newsletters-pagination">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={currentPage === page ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="newsletters-empty-state">
            <h2>Nu există newslettere momentan</h2>
            <p>Adaugă primul newsletter pentru a începe evidența creațiilor.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="newsletters-modal-overlay" onClick={closeModal}>
          <div
            className="newsletters-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsletters-modal-header">
              <div>
                <h2>
                  {isEditMode ? "Editează newsletter" : "Adaugă newsletter"}
                </h2>
                <p>
                  {isEditMode
                    ? "Actualizează informațiile newsletterului."
                    : "Completează informațiile pentru a adăuga un nou newsletter."}
                </p>
              </div>

              <button
                type="button"
                className="newsletters-modal-close"
                onClick={closeModal}
              >
                <IoClose />
              </button>
            </div>

            <form className="newsletters-form" onSubmit={handleSaveNewsletter}>
              <div className="newsletters-form-group">
                <label htmlFor="creationName">Nume creație</label>
                <input
                  id="creationName"
                  type="text"
                  placeholder="Introdu numele creației"
                  value={creationName}
                  onChange={(e) => setCreationName(e.target.value)}
                />
              </div>

              <div className="newsletters-form-row">
                <div className="newsletters-form-group">
                  <label htmlFor="client">Client</label>
                  <select
                    id="client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  >
                    <option value="Sephora">Sephora</option>
                    <option value="Alphega">Alphega</option>
                  </select>
                </div>

                <div className="newsletters-form-group">
                  <label htmlFor="newsletterType">Tip</label>
                  <select
                    id="newsletterType"
                    value={newsletterType}
                    onChange={(e) =>
                      setNewsletterType(e.target.value as NewsletterType)
                    }
                  >
                    <option value="Email">Email</option>
                    <option value="Rich SMS">Rich SMS</option>
                    <option value="Email + Rich SMS">Email + Rich SMS</option>
                  </select>
                </div>
              </div>

              <div className="newsletters-form-row">
                <div className="newsletters-form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as NewsletterStatus)
                    }
                  >
                    <option value="De făcut">De făcut</option>
                    <option value="În lucru">În lucru</option>
                    <option value="Finalizat">Finalizat</option>
                  </select>
                </div>

                <div className="newsletters-form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="newsletters-form-row">
                <div className="newsletters-form-group">
                  <label htmlFor="developer">Developer</label>
                  <select
                    id="developer"
                    value={developerId}
                    onChange={(e) => setDeveloperId(e.target.value)}
                    disabled={teamsLoading}
                  >
                    <option value="">
                      {teamsLoading
                        ? "Se încarcă developerii..."
                        : "Selectează developer-ul"}
                    </option>

                    {developerOptions.map((developer) => (
                      <option key={developer.uid} value={developer.uid}>
                        {developer.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="newsletters-form-group">
                  <label htmlFor="timeInMinutes">Timp (minute)</label>
                  <input
                    id="timeInMinutes"
                    type="number"
                    min="0"
                    placeholder="Ex: 45"
                    value={timeInMinutes}
                    onChange={(e) => setTimeInMinutes(e.target.value)}
                  />
                </div>
              </div>

              <div className="newsletters-form-group">
                <label htmlFor="onlineLink">Link online</label>
                <input
                  id="onlineLink"
                  type="text"
                  placeholder="Introdu linkul online"
                  value={onlineLink}
                  onChange={(e) => setOnlineLink(e.target.value)}
                />
              </div>

              <div className="newsletters-form-group">
                <label htmlFor="completedAt">Data finalizare</label>
                <input
                  id="completedAt"
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                />
              </div>

              {error && <div className="newsletters-form-error">{error}</div>}

              <div className="newsletters-form-actions">
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
