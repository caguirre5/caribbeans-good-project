import React, { useEffect, useMemo, useState } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
type GroupDoc = {
  id: string;
  name: string; // guardamos el slug directamente
};

const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const GroupsManager: React.FC = () => {
  const db = getFirestore();

  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [newGroup, setNewGroup] = useState("");
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<GroupDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const previewSlug = useMemo(() => slugify(newGroup), [newGroup]);
  const groupExists = useMemo(
    () => groups.some((g) => g.name === previewSlug),
    [groups, previewSlug]
  );

  const fetchGroups = async () => {
    try {
      const q = query(collection(db, "groups"), orderBy("name"));
      const snap = await getDocs(q);
      const list: GroupDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setGroups(list);
    } catch (e) {
      console.error("Error loading groups:", e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!previewSlug) return;
    if (groupExists) return;

    try {
      setLoading(true);
      await addDoc(collection(db, "groups"), {
        name: previewSlug,
        createdAt: serverTimestamp(),
      });
      setNewGroup("");
      fetchGroups();
    } catch (e) {
      console.error("Error creating group:", e);
      alert("Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, "groups", toDelete.id));
      setConfirmOpen(false);
      setToDelete(null);
      fetchGroups();
    } catch (e) {
      console.error("Error deleting group:", e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Card: más angosto y compacto */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 ">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-gray-900">Groups</h2>
          <span className="text-xs text-gray-500">{groups.length} total</span>
        </div>

        {/* Row compacta */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder='e.g. "colegio"'
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#044421]/25 focus:border-[#044421]/40"
            />

            {/* Preview compacto */}
            {newGroup && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-gray-500">Will be saved as:</span>
                <span className="font-mono bg-gray-100 border border-gray-200 px-2 py-[2px] rounded">
                  {previewSlug || "—"}
                </span>
                {groupExists && (
                  <span className="text-red-600">(already exists)</span>
                )}
              </div>
            )}
          </div>

          {/* Botón pequeño */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!previewSlug || groupExists || loading}
            className={[
              "h-10 px-3 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2",
              "border transition",
              !previewSlug || groupExists || loading
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-[#044421] text-white border-[#044421] hover:bg-[#06603a]",
            ].join(" ")}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Lista debajo, no dentro del card: se siente más “panel” */}
      <div className="mt-4 ">
        {groups.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No groups created yet.
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm
                           px-4 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {g.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Use this value in Sheets / users.groups
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setToDelete(g);
                    setConfirmOpen(true);
                  }}
                  className="h-9 w-9 rounded-lg border border-gray-200
                             bg-white hover:bg-red-50 hover:border-red-200
                             inline-flex items-center justify-center"
                  title="Delete group"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {confirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b">
              <h3 className="text-base font-semibold text-gray-900">
                Delete group
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This will remove the group from the dropdown list.
              </p>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-800">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{toDelete?.name}</span>?
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm
                             hover:bg-gray-50"
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-medium
                             hover:bg-red-700 disabled:bg-red-300"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManager;
