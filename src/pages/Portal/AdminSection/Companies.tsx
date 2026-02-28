import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faPlus,
  faTrash,
  faUserPlus,
  faPen,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

type CompanyDoc = {
  id: string;
  name: string;
  slug: string;
  createdAt?: any;
};

type MemberRole = "owner" | "admin" | "member" | "viewer";
type MemberStatus = "active" | "invited" | "disabled";

type MemberDoc = {
  uid: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt?: any;
};

type ApiUser = {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const displayUserName = (u: ApiUser) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;

const CompanyManager: React.FC = () => {
  const { currentUser } = useAuth();
  const db = getFirestore();

  // Companies
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // Create company
  const [newCompanyName, setNewCompanyName] = useState("");
  const previewSlug = useMemo(() => slugify(newCompanyName), [newCompanyName]);
  const companySlugExists = useMemo(
    () => companies.some((c) => c.slug === previewSlug),
    [companies, previewSlug]
  );
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Expand per company
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(
    null
  );

  // Users (from backend)
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Members cache per company
  const [membersByCompany, setMembersByCompany] = useState<
    Record<string, MemberDoc[]>
  >({});
  const [membersLoadingByCompany, setMembersLoadingByCompany] = useState<
    Record<string, boolean>
  >({});

  // UI in expanded: search + selection per company
  const [userSearchByCompany, setUserSearchByCompany] = useState<
    Record<string, string>
  >({});
  const [selectedUserUidByCompany, setSelectedUserUidByCompany] = useState<
    Record<string, string>
  >({});
  const [selectedRoleByCompany, setSelectedRoleByCompany] = useState<
    Record<string, MemberRole>
  >({});

  // Per-company action loading
  const [companyActionLoading, setCompanyActionLoading] = useState<
    Record<
      string,
      { add?: boolean; removeUid?: string; rename?: boolean; delete?: boolean }
    >
  >({});

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyDoc | null>(
    null
  );

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [companyToRename, setCompanyToRename] = useState<CompanyDoc | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");

  // ---------------------------
  // Fetchers
  // ---------------------------
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    setCompaniesError(null);
    try {
      const q = query(collection(db, "companies"), orderBy("name"));
      const snap = await getDocs(q);
      const list: CompanyDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setCompanies(list);
    } catch (e) {
      console.error(e);
      setCompaniesError("Failed to load companies.");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const token = await currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();

      // Normaliza a ApiUser
      const list: ApiUser[] = (Array.isArray(data) ? data : []).map((u: any) => ({
        uid: u.uid,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
      }));

      // Sort por email para UX
      list.sort((a, b) => a.email.localeCompare(b.email));
      setUsers(list);
    } catch (e) {
      console.error(e);
      setUsersError("Failed to load users.");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMembers = async (companyId: string) => {
    try {
      setMembersLoadingByCompany((prev) => ({ ...prev, [companyId]: true }));
      const q = query(
        collection(db, "companies", companyId, "members"),
        orderBy("email")
      );
      const snap = await getDocs(q);
      const list: MemberDoc[] = snap.docs.map((d) => d.data() as any);
      setMembersByCompany((prev) => ({ ...prev, [companyId]: list }));
    } catch (e) {
      console.error("Error loading members:", e);
      setMembersByCompany((prev) => ({ ...prev, [companyId]: [] }));
    } finally {
      setMembersLoadingByCompany((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------
  // Create company
  // ---------------------------
  const handleCreateCompany = async () => {
    const name = newCompanyName.trim();
    if (!name) return;
    if (!previewSlug || companySlugExists) return;

    try {
      setCreatingCompany(true);
      const ref = await addDoc(collection(db, "companies"), {
        name,
        slug: previewSlug,
        createdAt: serverTimestamp(),
      });

      setNewCompanyName("");
      await fetchCompanies();

      // Auto expand new company
      setExpandedCompanyId(ref.id);
      // Load members empty
      fetchMembers(ref.id);
    } catch (e) {
      console.error(e);
      alert("Failed to create company.");
    } finally {
      setCreatingCompany(false);
    }
  };

  // ---------------------------
  // Expand row
  // ---------------------------
  const toggleExpand = async (companyId: string) => {
    setExpandedCompanyId((prev) => (prev === companyId ? null : companyId));
    // Lazy-load members
    if (!membersByCompany[companyId]) {
      fetchMembers(companyId);
    }
  };

  // ---------------------------
  // Add member (selected from list)
  // ---------------------------
  const addSelectedUserToCompany = async (company: CompanyDoc) => {
    const companyId = company.id;
    const selectedUid = selectedUserUidByCompany[companyId];
    if (!selectedUid) return;

    const role = selectedRoleByCompany[companyId] ?? "member";
    const u = users.find((x) => x.uid === selectedUid);
    if (!u) return;

    try {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), add: true },
      }));

      // 1) membership (source of truth)
      await setDoc(doc(db, "companies", companyId, "members", selectedUid), {
        uid: selectedUid,
        email: u.email.toLowerCase(),
        role,
        status: "active",
        createdAt: serverTimestamp(),
      });

      // 2) cache on user
      await updateDoc(doc(db, "users", selectedUid), {
        companyIds: arrayUnion(companyId),
      });

      // refresh members UI
      await fetchMembers(companyId);

      // reset selection
      setSelectedUserUidByCompany((prev) => ({ ...prev, [companyId]: "" }));
      setSelectedRoleByCompany((prev) => ({ ...prev, [companyId]: "member" }));
    } catch (e) {
      console.error(e);
      alert("Failed to add user to company. Check Firestore rules.");
    } finally {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), add: false },
      }));
    }
  };

  // ---------------------------
  // Remove member
  // ---------------------------
  const removeMemberFromCompany = async (companyId: string, uid: string) => {
    try {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), removeUid: uid },
      }));

      await deleteDoc(doc(db, "companies", companyId, "members", uid));
      await updateDoc(doc(db, "users", uid), {
        companyIds: arrayRemove(companyId),
      });

      await fetchMembers(companyId);
    } catch (e) {
      console.error(e);
      alert("Failed to remove member.");
    } finally {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), removeUid: undefined },
      }));
    }
  };

  // ---------------------------
  // Rename company (modal)
  // ---------------------------
  const openRenameModal = (company: CompanyDoc) => {
    setCompanyToRename(company);
    setRenameValue(company.name);
    setRenameModalOpen(true);
  };

  const confirmRenameCompany = async () => {
    if (!companyToRename) return;
    const companyId = companyToRename.id;

    const name = renameValue.trim();
    if (!name) return;

    const newSlug = slugify(name);
    const slugTaken =
      companies.some((c) => c.slug === newSlug && c.id !== companyId) ||
      newSlug.length === 0;

    if (slugTaken) {
      alert("That company name/slug already exists.");
      return;
    }

    try {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), rename: true },
      }));

      await updateDoc(doc(db, "companies", companyId), {
        name,
        slug: newSlug,
        updatedAt: serverTimestamp(),
      });

      setRenameModalOpen(false);
      setCompanyToRename(null);
      setRenameValue("");
      await fetchCompanies();
    } catch (e) {
      console.error(e);
      alert("Failed to rename company.");
    } finally {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), rename: false },
      }));
    }
  };

  // ---------------------------
  // Delete company (modal)
  // ---------------------------
  const openDeleteModal = (company: CompanyDoc) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    const companyId = companyToDelete.id;

    try {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), delete: true },
      }));

      await deleteDoc(doc(db, "companies", companyId));

      setDeleteModalOpen(false);
      setCompanyToDelete(null);

      if (expandedCompanyId === companyId) setExpandedCompanyId(null);

      await fetchCompanies();
    } catch (e) {
      console.error(e);
      alert("Failed to delete company.");
    } finally {
      setCompanyActionLoading((prev) => ({
        ...prev,
        [companyId]: { ...(prev[companyId] || {}), delete: false },
      }));
    }
  };

  // ---------------------------
  // Derived helpers
  // ---------------------------
  const membersOf = (companyId: string) => membersByCompany[companyId] ?? [];
  const isMemberAlready = (companyId: string, uid: string) =>
    membersOf(companyId).some((m) => m.uid === uid);

  const filteredUsersForCompany = (companyId: string) => {
    const term = (userSearchByCompany[companyId] ?? "").trim().toLowerCase();
    const base = users;

    if (!term) return base;

    return base.filter((u) => {
      const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      return (
        u.email.toLowerCase().includes(term) || full.includes(term)
      );
    });
  };

  // ---------------------------
  // UI pieces
  // ---------------------------
  const CompanyExpanded = ({ company }: { company: CompanyDoc }) => {
    const companyId = company.id;

    const companyMembers = membersOf(companyId);
    const membersLoading = !!membersLoadingByCompany[companyId];

    const search = userSearchByCompany[companyId] ?? "";
    const filtered = filteredUsersForCompany(companyId);

    const selectedUid = selectedUserUidByCompany[companyId] ?? "";
    const selectedRole = selectedRoleByCompany[companyId] ?? "member";

    const selectedUser = users.find((u) => u.uid === selectedUid) || null;

    const disableAdd =
      !selectedUid ||
      companyActionLoading[companyId]?.add ||
      isMemberAlready(companyId, selectedUid);

    return (
      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        {/* Add member compact picker */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-700">
                Add user
              </span>
              <span className="text-xs text-gray-500">
                {usersLoading
                  ? "Loading users…"
                  : usersError
                  ? usersError
                  : `${users.length} total users`}
              </span>
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setUserSearchByCompany((prev) => ({
                  ...prev,
                  [companyId]: e.target.value,
                }))
              }
              placeholder="Search users…"
              className="mt-2 w-full border border-gray-300 px-2 py-1 rounded-md text-sm bg-white"
              disabled={usersLoading || !!usersError}
            />

            {/* List */}
            <div className="mt-2 rounded-md border border-gray-200 bg-white max-h-56 overflow-auto">
              {usersLoading ? (
                <div className="p-3 text-sm text-gray-500">Loading users…</div>
              ) : usersError ? (
                <div className="p-3 text-sm text-red-600">{usersError}</div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 italic">
                  0 users found.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map((u) => {
                    const already = isMemberAlready(companyId, u.uid);
                    const active = selectedUid === u.uid;
                    return (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() =>
                          setSelectedUserUidByCompany((prev) => ({
                            ...prev,
                            [companyId]: u.uid,
                          }))
                        }
                        className={[
                          "w-full text-left px-3 py-2 flex items-center justify-between gap-3",
                          active ? "bg-emerald-50" : "hover:bg-gray-50",
                        ].join(" ")}
                        disabled={already}
                        title={already ? "Already in this company" : "Select"}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {displayUserName(u)}
                            </span>
                            {already && (
                              <span className="text-xs text-gray-400">
                                (member)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {u.email}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {active && (
                            <span className="text-xs font-semibold text-[#174B3D]">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected + role + confirm */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRoleByCompany((prev) => ({
                    ...prev,
                    [companyId]: e.target.value as MemberRole,
                  }))
                }
                className="border border-gray-300 px-2 py-1 rounded-md text-sm bg-white"
                disabled={!selectedUid}
                title="Role"
              >
                <option value="owner">owner</option>
                <option value="admin">admin</option>
                <option value="member">member</option>
                <option value="viewer">viewer</option>
              </select>

              <button
                type="button"
                onClick={() => addSelectedUserToCompany(company)}
                disabled={disableAdd}
                className={[
                  "h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border",
                  disableAdd
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]",
                ].join(" ")}
                title="Confirm add user"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                {companyActionLoading[companyId]?.add
                  ? "Adding…"
                  : selectedUser
                  ? "Add selected"
                  : "Add"}
              </button>

              {selectedUser && (
                <span className="text-xs text-gray-500">
                  {isMemberAlready(companyId, selectedUser.uid)
                    ? "Already a member."
                    : `Will add: ${selectedUser.email}`}
                </span>
              )}
            </div>
          </div>

          {/* Members list */}
          <div className="w-full lg:w-[340px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-700">
                Members
              </span>
              <span className="text-xs text-gray-500">
                {membersLoading ? "Loading…" : `${companyMembers.length} total`}
              </span>
            </div>

            <div className="mt-2 rounded-md border border-gray-200 bg-white max-h-56 overflow-auto">
              {membersLoading ? (
                <div className="p-3 text-sm text-gray-500">Loading members…</div>
              ) : companyMembers.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 italic">
                  0 members.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {companyMembers.map((m) => {
                    const removing =
                      companyActionLoading[companyId]?.removeUid === m.uid;

                    return (
                      <div
                        key={m.uid}
                        className="px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {m.email}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {m.role} · {m.status}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMemberFromCompany(companyId, m.uid)}
                          disabled={removing}
                          className={[
                            "h-8 w-8 rounded-md border inline-flex items-center justify-center",
                            removing
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white border-red-200 text-red-700 hover:bg-red-50",
                          ].join(" ")}
                          title="Remove member"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Note: membership is stored in{" "}
              <span className="font-mono">companies/{companyId}/members</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CompanyRow = ({ company }: { company: CompanyDoc }) => {
    const expanded = expandedCompanyId === company.id;
    const membersCount = membersByCompany[company.id]?.length ?? 0;

    return (
      <div className="border-b">
        <button
          type="button"
          onClick={() => toggleExpand(company.id)}
          className="w-full text-left flex items-center justify-between gap-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {company.name}
              </span>
              <span className="text-xs text-gray-400 truncate">
                ({company.slug})
              </span>
              <span className="text-xs text-gray-500">
                · {membersCount} member(s)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openRenameModal(company);
              }}
              className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 inline-flex items-center justify-center"
              title="Rename company"
            >
              <FontAwesomeIcon icon={faPen} className="text-gray-600" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(company);
              }}
              className="h-9 w-9 rounded-md border border-red-200 bg-white hover:bg-red-50 inline-flex items-center justify-center"
              title="Delete company"
            >
              <FontAwesomeIcon icon={faTrash} className="text-red-600" />
            </button>

            <span className="text-xs text-gray-400 hidden lg:inline">
              {expanded ? "Close" : "Manage"}
            </span>
            <FontAwesomeIcon
              icon={expanded ? faChevronUp : faChevronDown}
              className="text-gray-500"
            />
          </div>
        </button>

        {expanded && <div className="pb-3">{<CompanyExpanded company={company} />}</div>}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Company Manager</h2>
          <p className="text-sm text-gray-500">
            Create companies and assign users (multi-user companies).
          </p>
        </div>
        <button
          onClick={() => {
            fetchCompanies();
            fetchUsers();
          }}
          className="text-gray-500 hover:text-gray-700"
          title="Refresh"
        >
          {/* Reuse your refresh icon elsewhere if you want, leaving simple */}
          <span className="text-sm font-semibold">Refresh</span>
        </button>
      </div>

      {/* Create company row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="New company name…"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded-md text-sm w-full md:w-80"
          />
          <button
            type="button"
            onClick={handleCreateCompany}
            disabled={!previewSlug || companySlugExists || creatingCompany}
            className={[
              "h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border",
              !previewSlug || companySlugExists || creatingCompany
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={faPlus} />
            {creatingCompany ? "Creating…" : "Create"}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          {newCompanyName ? (
            <>
              <span className="text-gray-500">Slug:</span>{" "}
              <span className="font-mono">{previewSlug || "—"}</span>{" "}
              {companySlugExists && (
                <span className="text-red-600"> (already exists)</span>
              )}
            </>
          ) : (
            <span>
              {loadingCompanies
                ? "Loading companies…"
                : companiesError
                ? companiesError
                : `${companies.length} companies`}
            </span>
          )}
        </div>
      </div>

      {/* Companies list */}
      {loadingCompanies ? (
        <p className="text-sm text-gray-500">Loading companies…</p>
      ) : companiesError ? (
        <p className="text-sm text-red-600">{companiesError}</p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No companies created yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {companies.map((c) => (
            <CompanyRow key={c.id} company={c} />
          ))}
        </div>
      )}

      {/* RENAME MODAL */}
      {renameModalOpen && companyToRename && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Rename Company</h2>
            <p className="text-sm text-gray-600 mb-4">
              Update company name (slug will be updated too).
            </p>

            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="border border-gray-300 px-2 py-1 rounded-md text-sm w-full"
              placeholder="Company name…"
            />

            <div className="mt-2 text-xs text-gray-500">
              New slug:{" "}
              <span className="font-mono">{slugify(renameValue) || "—"}</span>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                onClick={() => {
                  setRenameModalOpen(false);
                  setCompanyToRename(null);
                  setRenameValue("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#174B3D] text-white rounded text-sm hover:bg-[#0f3a2d]"
                onClick={confirmRenameCompany}
                disabled={
                  !renameValue.trim() ||
                  companyActionLoading[companyToRename.id]?.rename
                }
              >
                {companyActionLoading[companyToRename.id]?.rename
                  ? "Saving…"
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && companyToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will delete the company document. Firestore does not
              automatically delete subcollections (members).
            </p>

            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Delete <span className="font-semibold">{companyToDelete.name}</span>?
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCompanyToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-500 text-white rounded text-sm ${
                  companyActionLoading[companyToDelete.id]?.delete
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-red-600"
                }`}
                onClick={confirmDeleteCompany}
                disabled={!!companyActionLoading[companyToDelete.id]?.delete}
              >
                {companyActionLoading[companyToDelete.id]?.delete
                  ? "Deleting…"
                  : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManager;
