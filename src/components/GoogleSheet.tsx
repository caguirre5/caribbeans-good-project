import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCodeCompare,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { fetchReadableInventoryDocs } from "../utils/inventoryVisibility";

interface InventoryTableRow {
  id: string;
  Farm: string;
  Variety: string;
  Process: string;
  "Our Tasting Notes": string;
  Bags: string;
  Price: string;
  Group?: string;
  groupNames: string[];
  isActive: boolean;
  availableBags: number;
}

const norm = (s: any) => String(s ?? "").trim().toLowerCase();

const toNum = (value: unknown, fallback = 0) => {
  const n =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

const normalizeGroups = (raw: any) => {
  if (Array.isArray(raw)) {
    return raw
      .map((g: any) => {
        if (typeof g === "string") return g.trim();
        if (g && typeof g === "object") return String(g.name ?? g.id ?? g.value ?? "").trim();
        return "";
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

const formatPrice = (value: unknown) => {
  const price = toNum(value);
  if (!price) return "";
  return `£ ${price.toFixed(2)}`;
};

const formatVariety = (row: any) => {
  const variety = String(row.variety ?? "").trim();
  const harvestYear = String(row.harvestYear ?? "").trim();
  return harvestYear ? `${harvestYear} - ${variety}` : variety;
};

const makeCoffeeKey = (row: InventoryTableRow) => row.id;

const isExclusive = (row: InventoryTableRow) => row.groupNames.length > 0;

const CompareModal = ({
  open,
  onClose,
  left,
  right,
}: {
  open: boolean;
  onClose: () => void;
  left: InventoryTableRow;
  right: InventoryTableRow;
}) => {
  if (!open) return null;

  const Row = ({
    label,
    a,
    b,
  }: {
    label: string;
    a: React.ReactNode;
    b: React.ReactNode;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="text-sm text-gray-900">{a}</div>
      <div className="text-sm text-gray-900">{b}</div>
    </div>
  );

  const Badge = ({ show }: { show: boolean }) =>
    show ? (
      <span className="text-[10px] font-semibold px-2 py-[2px] rounded bg-yellow-100 text-yellow-800 border border-yellow-400">
        EXCLUSIVE
      </span>
    ) : null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Compare coffees
            </h3>
            <p className="text-sm text-gray-600 mt-1">Side-by-side comparison</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
            title="Close"
          >
            <FontAwesomeIcon icon={faXmark} className="text-gray-600" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b border-gray-100">
            <div />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {left.Variety}
                </span>
                <Badge show={isExclusive(left)} />
              </div>
              <div className="text-xs text-gray-500 truncate">{left.Farm}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {right.Variety}
                </span>
                <Badge show={isExclusive(right)} />
              </div>
              <div className="text-xs text-gray-500 truncate">{right.Farm}</div>
            </div>
          </div>

          <Row label="Farm" a={left.Farm} b={right.Farm} />
          <Row label="Variety" a={left.Variety} b={right.Variety} />
          <Row label="Process" a={left.Process} b={right.Process} />
          <Row
            label="Our tasting notes"
            a={<span className="text-sm">{left["Our Tasting Notes"]}</span>}
            b={<span className="text-sm">{right["Our Tasting Notes"]}</span>}
          />
          <Row label="Bags available" a={left.Bags} b={right.Bags} />
          <Row label="Price / kg" a={left.Price} b={right.Price} />
        </div>

        <div className="p-5 border-t flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const GoogleSheetTable: React.FC = () => {
  const { currentUser } = useAuth();

  const [data, setData] = useState<InventoryTableRow[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const fetchUserAccess = async () => {
      try {
        if (!currentUser?.uid) {
          setUserGroups([]);
          setIsAdmin(false);
          setAccessLoaded(true);
          return;
        }

        setAccessLoaded(false);
        const db = getFirestore();
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setUserGroups([]);
          setIsAdmin(false);
          setAccessLoaded(true);
          return;
        }

        const userData = snap.data();
        setUserGroups(normalizeGroups(userData?.groups));
        setIsAdmin(Array.isArray(userData?.roles) && userData.roles.includes("admin"));
      } catch (e) {
        console.error("Error fetching user access:", e);
        setUserGroups([]);
        setIsAdmin(false);
      } finally {
        setAccessLoaded(true);
      }
    };

    fetchUserAccess();
  }, [currentUser?.uid]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!currentUser?.uid) {
        setData([]);
        setLoading(false);
        return;
      }
      if (!accessLoaded) return;

      try {
        setLoading(true);
        setError(null);

        const db = getFirestore();
        const inventoryDocs = await fetchReadableInventoryDocs(db, { isAdmin, userGroups });
        const formattedData: InventoryTableRow[] = inventoryDocs.map((docSnap) => {
          const row = docSnap.data() as any;
          const groupNames = normalizeGroups(row.groupNames);
          const availableBags = Math.max(0, toNum(row.availableBags) - toNum(row.reservedBags));

          return {
            id: docSnap.id,
            Farm: String(row.farm ?? "").trim(),
            Variety: formatVariety(row),
            Process: String(row.process ?? "").trim(),
            "Our Tasting Notes": String(row.tastingNotes ?? "").trim(),
            Bags: String(availableBags),
            Price: formatPrice(row.pricePerKg),
            Group: groupNames.join(", "),
            groupNames,
            isActive: row.isActive !== false,
            availableBags,
          };
        });

        setData(formattedData);
      } catch (e) {
        console.error("Error fetching inventory:", e);
        const detail =
          import.meta.env.DEV && e instanceof Error
            ? ` ${e.message}`
            : "";
        setError(`We couldn't load availability right now.${detail}`);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [accessLoaded, currentUser?.uid, isAdmin, userGroups]);

  const visibleData = useMemo(() => {
    return data
      .filter((item) => {
        if (!item.isActive) return false;
        if (!item.groupNames.length) return true;
        if (isAdmin) return true;

        return item.groupNames.some((groupName) =>
          userGroups.some((userGroup) => norm(userGroup) === norm(groupName))
        );
      })
      .sort((a, b) => b.availableBags - a.availableBags);
  }, [data, isAdmin, userGroups]);

  const rowByKey = useMemo(() => {
    const map = new Map<string, InventoryTableRow>();
    for (const row of visibleData) map.set(makeCoffeeKey(row), row);
    return map;
  }, [visibleData]);

  const selectedRows = useMemo(() => {
    return selectedKeys.map((key) => rowByKey.get(key)).filter(Boolean) as InventoryTableRow[];
  }, [selectedKeys, rowByKey]);

  const toggleSelect = (row: InventoryTableRow) => {
    const key = makeCoffeeKey(row);
    setSelectedKeys((prev) => {
      const exists = prev.includes(key);
      if (exists) return prev.filter((current) => current !== key);
      if (prev.length >= 2) return [prev[1], key];
      return [...prev, key];
    });
  };

  const clearSelection = () => {
    setSelectedKeys([]);
    setCompareOpen(false);
  };

  const canCompare = selectedRows.length === 2;

  return (
    <div className="container mx-auto p-4 relative">
      {loading && (
        <div className="w-full rounded-lg border border-[#044421]/10 bg-white p-6 text-center text-sm text-[#044421]/70">
          Loading availability...
        </div>
      )}

      {!loading && error && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && visibleData.length === 0 && (
        <div className="w-full rounded-lg border border-[#044421]/10 bg-white p-6 text-center text-sm text-[#044421]/70">
          No coffee availability to show right now.
        </div>
      )}

      {!loading && !error && visibleData.length > 0 && (
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="text-xs">
            <tr>
              <th className="py-2 px-2 border-b bg-[#9da793] text-center w-[110px]">
                Compare
              </th>
              <th className="py-2 px-4 border-b bg-[#9da793] text-center">Farm</th>
              <th className="py-2 px-4 border-b bg-[#9da793] text-center">Variety</th>
              <th className="py-2 px-4 border-b bg-[#9da793] text-center">Process</th>
              <th className="py-2 px-4 border-b bg-[#9da793] text-center">
                Our Tasting Notes
              </th>
              <th className="py-2 px-4 border-b bg-[#9da793] text-center">
                Bags available
              </th>
              <th className="py-2 px-8 border-b bg-[#9da793] text-center">
                Price / kg
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleData.map((row, index) => {
              const exclusive = isExclusive(row);
              const key = makeCoffeeKey(row);
              const selected = selectedKeys.includes(key);

              return (
                <tr
                  key={key}
                  className={[
                    index % 2 === 0 ? "bg-[#c9d3c0]" : "bg-white",
                    "hover:bg-[#e6a318] text-xs",
                    exclusive ? "border-2 border-yellow-500" : "",
                  ].join(" ")}
                  title={exclusive ? `Exclusive for: ${row.Group}` : undefined}
                >
                  <td className="py-2 px-2 border-b">
                    <button
                      type="button"
                      onClick={() => toggleSelect(row)}
                      className={[
                        "h-8 w-full rounded-md text-xs font-semibold border transition",
                        selected
                          ? "bg-[#174B3D] text-white border-[#174B3D]"
                          : "bg-white text-[#174B3D] border-[#174B3D]/30 hover:bg-[#174B3D]/10",
                      ].join(" ")}
                      title={selected ? "Remove from compare" : "Add to compare"}
                    >
                      {selected ? "Selected" : "Compare"}
                    </button>
                  </td>

                  <td className="py-2 px-4 border-b">{row.Farm}</td>

                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center gap-2">
                      <span>{row.Variety}</span>
                      {exclusive && (
                        <span className="text-[10px] font-semibold px-2 py-[2px] rounded bg-yellow-100 text-yellow-800 border border-yellow-400">
                          EXCLUSIVE
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-4 border-b">{row.Process}</td>
                  <td className="py-2 px-4 border-b">{row["Our Tasting Notes"]}</td>
                  <td className="py-2 px-4 border-b">
                    {row.availableBags > 0 ? (
                      row.Bags
                    ) : (
                      <span className="font-semibold text-red-700">Sold Out</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{row.Price}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedRows.length > 0 && (
        <div className="fixed left-0 right-0 bottom-0 z-40 p-3">
          <div
            className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-xl rounded-xl p-3
                       flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-700">
                Compare ({selectedRows.length}/2)
              </div>

              <div className="mt-1 flex flex-wrap gap-1">
                {selectedRows.map((row) => (
                  <span
                    key={makeCoffeeKey(row)}
                    className="text-xs pl-2 pr-1 py-[2px] rounded-full border bg-white border-gray-200 text-gray-700 inline-flex items-center gap-2"
                    title={row.Variety}
                  >
                    {row.Variety}
                    <button
                      type="button"
                      onClick={() => toggleSelect(row)}
                      className="h-5 w-5 rounded-full hover:bg-gray-100 inline-flex items-center justify-center"
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-[10px] text-gray-500" />
                    </button>
                  </span>
                ))}

                {selectedRows.length === 1 && (
                  <span className="text-xs text-gray-500 italic">
                    Select one more coffee to compare.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={!canCompare}
                className={[
                  "h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border",
                  !canCompare
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-[#174B3D] text-white border-[#174B3D] hover:bg-[#0f3a2d]",
                ].join(" ")}
                title="Open compare"
              >
                <FontAwesomeIcon icon={faCodeCompare} />
                Compare
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2 border border-red-200 bg-white text-red-700 hover:bg-red-50"
                title="Clear selection"
              >
                <FontAwesomeIcon icon={faTrash} />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRows.length === 2 && (
        <CompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          left={selectedRows[0]}
          right={selectedRows[1]}
        />
      )}
    </div>
  );
};

export default GoogleSheetTable;
