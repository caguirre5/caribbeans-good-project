import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faPlus,
  faStar,
  faSyncAlt,
  faTrash,
  faUserShield,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour(s) ago`;
  return `${Math.floor(diff / 86400)} day(s) ago`;
};

type GroupDoc = { id: string; name: string };

const UserList: React.FC = () => {
  const { currentUser } = useAuth();
  const db = getFirestore();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Search / tabs
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "unverified">("active");
  const [activeSort, setActiveSort] = useState<
    "lastLogin_desc" | "lastLogin_asc"
  >("lastLogin_desc");

  // Groups
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // Per-user select value
  const [selectedGroup, setSelectedGroup] = useState<{ [uid: string]: string }>(
    {}
  );

  // Per-user action loading
  const [loadingAction, setLoadingAction] = useState<{
    [uid: string]: { add?: boolean; remove?: boolean; role?: boolean };
  }>({});

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users: ", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      setGroupsError(null);
      const q = query(collection(db, "groups"), orderBy("name"));
      const snap = await getDocs(q);
      const list: GroupDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setGroups(list);
    } catch (e) {
      console.error("Error loading groups:", e);
      setGroupsError("Failed to load groups.");
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalUser ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalUser]);

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActive = filteredUsers
    .filter((u) => u.isActive === true)
    .sort((a, b) => {
      const aTs = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const bTs = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      return activeSort === "lastLogin_desc" ? bTs - aTs : aTs - bTs;
    });

  const filteredUnverified = filteredUsers.filter(
    (u) => u.emailVerified === false
  );

  const userGroups = (u: any): string[] =>
    Array.isArray(u.groups) ? u.groups : [];
  const hasAnyGroup = (u: any) => userGroups(u).length > 0;

  // --- DELETE (backend) ---
  const handleDelete = async (uid: string) => {
    if (uid === currentUser?.uid)
      return alert("You can't delete your own account");

    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${uid}/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.uid !== uid));
        setModalUser(null);
        setConfirmChecked(false);
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- ROLE (backend) ---
  const toggleRoasterRole = async (uid: string, hasRole: boolean) => {
    try {
      setLoadingAction((prev) => ({
        ...prev,
        [uid]: { ...(prev[uid] || {}), role: true },
      }));

      const token = await currentUser?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${uid}/role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "roaster" }),
        }
      );

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid
              ? {
                  ...u,
                  roles: hasRole
                    ? u.roles.filter((r: string) => r !== "roaster")
                    : [...(Array.isArray(u.roles) ? u.roles : []), "roaster"],
                }
              : u
          )
        );
      } else {
        alert("Failed to update role");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction((prev) => ({
        ...prev,
        [uid]: { ...(prev[uid] || {}), role: false },
      }));
    }
  };

  const isRoaster = (u: any) =>
    Array.isArray(u.roles) && u.roles.includes("roaster");

  // ✅ GROUPS (direct Firestore, no backend)
  const addGroupToUser = async (uid: string, groupName: string) => {
    try {
      setLoadingAction((prev) => ({
        ...prev,
        [uid]: { ...(prev[uid] || {}), add: true },
      }));

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        groups: arrayUnion(groupName),
      });

      // update local UI
      setUsers((prev) =>
        prev.map((u) => {
          if (u.uid !== uid) return u;
          const current = userGroups(u);
          if (current.includes(groupName)) return u;
          return { ...u, groups: [...current, groupName] };
        })
      );

      setSelectedGroup((prev) => ({ ...prev, [uid]: "" }));
    } catch (e) {
      console.error("Error adding group:", e);
      alert("Failed to add group. Check Firestore rules for /users.");
    } finally {
      setLoadingAction((prev) => ({
        ...prev,
        [uid]: { ...(prev[uid] || {}), add: false },
      }));
    }
  };

  const removeGroupFromUser = async (uid: string, groupName: string) => {
    try {
      setLoadingAction((prev) => ({
        ...prev,
        [uid]: { ...(prev[uid] || {}), remove: true },
      }));

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        groups: arrayRemove(groupName),
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, groups: userGroups(u).filter((g) => g !== groupName) }
            : u
        )
      );
    } catch (e) {
      console.error("Error removing group:", e);
      alert("Failed to remove group. Check Firestore rules for /users.");
    } finally {
      setLoadingAction((prev) => ({
        ...prev,
        [uid]: { ...(prev[uid] || {}), remove: false },
      }));
    }
  };

  const renderExpanded = (user: any) => {
    const current = userGroups(user);

    return (
      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        {/* Add group row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Groups</span>

            <select
              value={selectedGroup[user.uid] ?? ""}
              onChange={(e) =>
                setSelectedGroup((prev) => ({
                  ...prev,
                  [user.uid]: e.target.value,
                }))
              }
              className="h-9 rounded-md border border-gray-300 px-2 text-sm bg-white w-full sm:w-auto"
              disabled={groupsLoading || groups.length === 0}
            >
              <option value="" disabled>
                Select group…
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.name} disabled={current.includes(g.name)}>
                  {g.name} {current.includes(g.name) ? "(assigned)" : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                const g = selectedGroup[user.uid];
                if (!g) return;
                addGroupToUser(user.uid, g);
              }}
              disabled={!selectedGroup[user.uid] || loadingAction[user.uid]?.add}
              className={[
                "h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border",
                !selectedGroup[user.uid] || loadingAction[user.uid]?.add
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]",
              ].join(" ")}
              title="Add group"
            >
              <FontAwesomeIcon icon={faPlus} />
              {loadingAction[user.uid]?.add ? "Adding…" : "Add"}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {groupsLoading
              ? "Loading groups…"
              : groupsError
              ? groupsError
              : `${groups.length} available`}
          </div>
        </div>

        {/* Current groups */}
        <div className="mt-2 flex flex-wrap gap-1">
          {current.length === 0 ? (
            <span className="text-xs text-gray-500 italic">No groups assigned.</span>
          ) : (
            current.map((g) => (
              <span
                key={g}
                className="text-xs pl-2 pr-1 py-[2px] rounded-full border bg-white border-gray-200 text-gray-700
                           inline-flex items-center gap-2"
                title="Assigned group"
              >
                {g}
                <button
                  type="button"
                  onClick={() => removeGroupFromUser(user.uid, g)}
                  disabled={loadingAction[user.uid]?.remove}
                  className="h-5 w-5 rounded-full hover:bg-gray-100 inline-flex items-center justify-center"
                  title="Remove group"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[10px] text-gray-500" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => toggleRoasterRole(user.uid, isRoaster(user))}
            disabled={loadingAction[user.uid]?.role}
            className={[
              "h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border",
              "bg-white border-gray-200 hover:bg-gray-100",
              loadingAction[user.uid]?.role ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={faUserShield} className="text-gray-600" />
            {loadingAction[user.uid]?.role
              ? "Updating…"
              : isRoaster(user)
              ? "Revoke Roaster"
              : "Make Roaster"}
          </button>

          <button
            type="button"
            onClick={() => setModalUser(user.uid)}
            className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2
                       border border-red-200 bg-white text-red-700 hover:bg-red-50"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete User
          </button>
        </div>
      </div>
    );
  };

  const UserRow = ({ user }: { user: any }) => {
    const expanded = expandedUid === user.uid;
    const badge = hasAnyGroup(user);

    return (
      <div className="border-b">
        <button
          type="button"
          onClick={() =>
            setExpandedUid((prev) => (prev === user.uid ? null : user.uid))
          }
          className="w-full text-left flex items-center justify-between gap-3 py-2"
        >
          <div className="min-w-0 flex items-center gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </span>
                {badge && (
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full
                              bg-amber-100 border border-amber-200"
                    title="Has group(s)"
                  >
                    <FontAwesomeIcon icon={faStar} className="text-amber-500 text-[11px]" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-gray-500 truncate">{user.email}</span>
                {user.lastLogin && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {getRelativeTime(user.lastLogin)}
                  </span>
                )}
              </div>
            </div>

            
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 hidden lg:inline">
              {expanded ? "Close" : "Manage"}
            </span>
            <FontAwesomeIcon
              icon={expanded ? faChevronUp : faChevronDown}
              className="text-gray-500"
            />
          </div>
        </button>

        {expanded && <div className="pb-3">{renderExpanded(user)}</div>}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          onClick={() => setActiveTab("active")}
          className={`py-2 px-4 font-semibold ${
            activeTab === "active"
              ? "border-b-2 border-[#174B3D] text-[#174B3D]"
              : "text-gray-500"
          }`}
        >
          Active Users
        </button>
        <button
          onClick={() => setActiveTab("unverified")}
          className={`py-2 px-4 font-semibold ${
            activeTab === "unverified"
              ? "border-b-2 border-[#174B3D] text-[#174B3D]"
              : "text-gray-500"
          }`}
        >
          Unverified Users
        </button>
      </div>

      {/* Search and refresh */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded-md text-sm"
          />
          {activeTab === "active" && (
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as any)}
              className="border border-gray-300 px-2 py-1 rounded-md text-sm"
            >
              <option value="lastLogin_desc">Last login (newest)</option>
              <option value="lastLogin_asc">Last login (oldest)</option>
            </select>
          )}
        </div>

        <button
          onClick={() => {
            fetchUsers();
            fetchGroups();
          }}
          className="text-gray-500 hover:text-gray-700"
          title="Refresh"
        >
          <FontAwesomeIcon icon={faSyncAlt} className="h-5 w-5" />
        </button>
      </div>

      {/* User lists */}
      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p>{error}</p>
      ) : activeTab === "active" ? (
        filteredActive.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredActive.map((user) => (
              <UserRow key={user.uid} user={user} />
            ))}
          </div>
        ) : (
          <p>No active users found.</p>
        )
      ) : filteredUnverified.length > 0 ? (
        filteredUnverified
          .sort(
            (a, b) => (a.createdAt?._seconds || 0) - (b.createdAt?._seconds || 0)
          )
          .map((user) => (
            <div
              key={user.uid}
              className="flex flex-col lg:flex-row justify-between items-center mb-4 p-2 border-b"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <p className="font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Created on:{" "}
                  {user.createdAt && typeof user.createdAt._seconds === "number"
                    ? new Date(user.createdAt._seconds * 1000).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" }
                      )
                    : "Unknown"}
                </p>
              </div>
            </div>
          ))
      ) : (
        <p>No users pending email verification.</p>
      )}

      {/* Confirm Delete Modal */}
      {modalUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Please confirm you want to delete
              this user.
            </p>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={() => setConfirmChecked(!confirmChecked)}
                className="mr-2"
              />
              I understand this action is permanent
            </label>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                onClick={() => {
                  setModalUser(null);
                  setConfirmChecked(false);
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-500 text-white rounded text-sm ${
                  !confirmChecked
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-red-600"
                }`}
                disabled={!confirmChecked}
                onClick={() => handleDelete(modalUser)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
