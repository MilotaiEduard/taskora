import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { IoClose } from "react-icons/io5";
import { MdOutlineAdd } from "react-icons/md";
import { auth, db } from "../../firebase/firebase";

export const Route = createFileRoute("/app/teams")({
  component: RouteComponent,
});

type TeamMember = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "owner" | "member";
};

type Team = {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerDisplayName: string;
  members: TeamMember[];
  memberIds: string[];
};

type SearchUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

function RouteComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<SearchUser | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchTeams() {
      if (!user) {
        setTeams([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const teamsRef = collection(db, "teams");
        const q = query(
          teamsRef,
          where("memberIds", "array-contains", user.uid),
        );
        const snapshot = await getDocs(q);

        const fetchedTeams: Team[] = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          name: docItem.data().name,
          ownerId: docItem.data().ownerId,
          ownerEmail: docItem.data().ownerEmail,
          ownerDisplayName: docItem.data().ownerDisplayName,
          members: docItem.data().members || [],
          memberIds: docItem.data().memberIds || [],
        }));

        setTeams(fetchedTeams);
      } catch (err) {
        console.error("Eroare la încărcarea echipelor:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [user]);

  function resetForm() {
    setTeamName("");
    setSearchEmail("");
    setSearchedUser(null);
    setSelectedMembers([]);
    setError("");
    setSearchMessage("");
    setSuccess("");
  }

  function openModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  async function fetchTeamsAgain() {
    if (!user) return;

    try {
      const teamsRef = collection(db, "teams");
      const q = query(teamsRef, where("memberIds", "array-contains", user.uid));
      const snapshot = await getDocs(q);

      const fetchedTeams: Team[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        name: docItem.data().name,
        ownerId: docItem.data().ownerId,
        ownerEmail: docItem.data().ownerEmail,
        ownerDisplayName: docItem.data().ownerDisplayName,
        members: docItem.data().members || [],
        memberIds: docItem.data().memberIds || [],
      }));

      setTeams(fetchedTeams);
    } catch (err) {
      console.error("Eroare la reîncărcarea echipelor:", err);
    }
  }

  async function handleSearchByEmail() {
    setError("");
    setSearchMessage("");
    setSearchedUser(null);

    if (!searchEmail.trim()) {
      setSearchMessage("Introdu o adresă de email.");
      return;
    }

    if (!user) {
      setError("Trebuie să fii autentificat.");
      return;
    }

    try {
      setSearchLoading(true);

      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", searchEmail.trim().toLowerCase()),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSearchMessage("Nu am găsit niciun utilizator cu acest email.");
        return;
      }

      const foundUser = snapshot.docs[0].data();

      if (foundUser.uid === user.uid) {
        setSearchMessage("Nu te poți adăuga pe tine ca membru suplimentar.");
        return;
      }

      const alreadySelected = selectedMembers.some(
        (member) => member.uid === foundUser.uid,
      );

      if (alreadySelected) {
        setSearchMessage("Acest utilizator este deja adăugat în echipă.");
        return;
      }

      setSearchedUser({
        uid: foundUser.uid,
        email: foundUser.email,
        displayName: foundUser.displayName || "Utilizator",
        photoURL: foundUser.photoURL || "",
      });
    } catch (err) {
      console.error("Eroare la căutarea utilizatorului:", err);
      setSearchMessage("A apărut o eroare la căutare.");
    } finally {
      setSearchLoading(false);
    }
  }

  function handleAddMember() {
    if (!searchedUser) return;

    setSelectedMembers((prev) => [...prev, searchedUser]);
    setSearchedUser(null);
    setSearchEmail("");
    setSearchMessage("");
  }

  function handleRemoveMember(uid: string) {
    setSelectedMembers((prev) => prev.filter((member) => member.uid !== uid));
  }

  async function handleCreateTeam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      setError("Trebuie să fii autentificat.");
      return;
    }

    if (!teamName.trim()) {
      setError("Te rog să introduci numele echipei.");
      return;
    }

    try {
      setSaving(true);

      const ownerMember: TeamMember = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Owner",
        photoURL: user.photoURL || "",
        role: "owner",
      };

      const otherMembers: TeamMember[] = selectedMembers.map((member) => ({
        ...member,
        role: "member",
      }));

      const allMembers = [ownerMember, ...otherMembers];

      await addDoc(collection(db, "teams"), {
        name: teamName.trim(),
        ownerId: user.uid,
        ownerEmail: user.email || "",
        ownerDisplayName: user.displayName || "Owner",
        members: allMembers,
        memberIds: allMembers.map((member) => member.uid),
        createdAt: serverTimestamp(),
      });

      await fetchTeamsAgain();
      setSuccess("Echipa a fost creată cu succes.");
      closeModal();
    } catch (err) {
      console.error("Eroare la crearea echipei:", err);
      setError("A apărut o eroare la crearea echipei.");
    } finally {
      setSaving(false);
    }
  }

  function getMemberInitial(name: string) {
    return name?.trim()?.charAt(0)?.toUpperCase() || "U";
  }

  return (
    <div className="teams-page">
      <div className="teams-page-header">
        <div className="teams-page-header-text">
          <h1 className="teams-page-title">Echipe</h1>
          <p className="teams-page-subtitle">
            Creează echipe, adaugă membri după email și organizează colaborarea
            pe proiecte.
          </p>
        </div>

        <button className="teams-create-button" onClick={openModal}>
          <MdOutlineAdd />
          Creează echipă
        </button>
      </div>

      <div className="teams-page-content">
        {loading ? (
          <div className="teams-empty-state">
            <h2>Se încarcă echipele...</h2>
          </div>
        ) : teams.length > 0 ? (
          <div className="teams-grid">
            {teams.map((team) => (
              <div className="team-card" key={team.id}>
                <div className="team-card-top">
                  <div>
                    <h2 className="team-card-title">{team.name}</h2>
                    <p className="team-card-owner">
                      Owner: {team.ownerDisplayName}
                    </p>
                  </div>

                  <div className="team-card-count">
                    {team.members.length} membri
                  </div>
                </div>

                <div className="team-card-members">
                  {team.members.map((member) => (
                    <div className="team-card-member" key={member.uid}>
                      <div className="team-card-member-avatar">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} />
                        ) : (
                          <span>{getMemberInitial(member.displayName)}</span>
                        )}
                      </div>

                      <div className="team-card-member-info">
                        <div className="team-card-member-name">
                          {member.displayName}
                        </div>
                        <div className="team-card-member-email">
                          {member.email}
                        </div>
                      </div>

                      <div
                        className={`team-card-member-role ${member.role === "owner" ? "owner" : "member"}`}
                      >
                        {member.role === "owner" ? "Owner" : "Membru"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="teams-empty-state">
            <h2>Nu ai încă nicio echipă</h2>
            <p>
              Creează prima echipă pentru a putea colabora pe proiecte de
              echipă.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="teams-modal-overlay" onClick={closeModal}>
          <div className="teams-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teams-modal-header">
              <div>
                <h2>Creează echipă</h2>
                <p>Adaugă un nume și caută membri după email.</p>
              </div>

              <button className="teams-modal-close" onClick={closeModal}>
                <IoClose />
              </button>
            </div>

            <form className="teams-form" onSubmit={handleCreateTeam}>
              <div className="teams-form-group">
                <label htmlFor="teamName">Nume echipă</label>
                <input
                  id="teamName"
                  type="text"
                  placeholder="Introdu numele echipei"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="teams-form-group">
                <label htmlFor="searchEmail">Caută membru după email</label>

                <div className="teams-search-row">
                  <input
                    id="searchEmail"
                    type="email"
                    placeholder="Introdu emailul utilizatorului"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    className="search-button"
                    onClick={handleSearchByEmail}
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Se caută..." : "Caută"}
                  </button>
                </div>

                {searchMessage && (
                  <div className="teams-form-info">{searchMessage}</div>
                )}

                {searchedUser && (
                  <div className="searched-user-card">
                    <div className="searched-user-card-info">
                      <div className="searched-user-card-name">
                        {searchedUser.displayName}
                      </div>
                      <div className="searched-user-card-email">
                        {searchedUser.email}
                      </div>
                    </div>

                    <button type="button" onClick={handleAddMember}>
                      Adaugă
                    </button>
                  </div>
                )}
              </div>

              <div className="teams-form-group">
                <label>Membri selectați</label>

                <div className="selected-members-list">
                  <div className="selected-member owner-member">
                    <div className="selected-member-left">
                      <div className="selected-member-avatar">
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || "Owner"}
                          />
                        ) : (
                          <span>
                            {getMemberInitial(user?.displayName || "Owner")}
                          </span>
                        )}
                      </div>

                      <div className="selected-member-info">
                        <div className="selected-member-name">
                          {user?.displayName || "Owner"}
                        </div>
                        <div className="selected-member-email">
                          {user?.email || ""}
                        </div>
                      </div>
                    </div>

                    <div className="selected-member-role owner">Owner</div>
                  </div>

                  {selectedMembers.length > 0 ? (
                    selectedMembers.map((member) => (
                      <div className="selected-member" key={member.uid}>
                        <div className="selected-member-left">
                          <div className="selected-member-avatar">
                            {member.photoURL ? (
                              <img
                                src={member.photoURL}
                                alt={member.displayName}
                              />
                            ) : (
                              <span>
                                {getMemberInitial(member.displayName)}
                              </span>
                            )}
                          </div>

                          <div className="selected-member-info">
                            <div className="selected-member-name">
                              {member.displayName}
                            </div>
                            <div className="selected-member-email">
                              {member.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="remove-member-button"
                          onClick={() => handleRemoveMember(member.uid)}
                        >
                          Elimină
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="selected-members-empty">
                      Nu ai adăugat încă membri în echipă.
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="teams-form-error">{error}</div>}
              {success && <div className="teams-form-success">{success}</div>}

              <div className="teams-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Se salvează..." : "Creează echipa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
