import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faCodeCompare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface SheetData {
  Farm: string;
  Variety: string;
  Process: string;
  "Our Tasting Notes": string;
  "30 KG Sacks": string; // en UI lo muestras como 24 KG Bags
  Price: string;
  "12 bags Bundle + 1 Free": string;
  Group?: string;
}

// ✅ Normaliza strings para keys / comparación simple
const norm = (s: any) => String(s ?? "").trim().toLowerCase();

// ✅ crea una key estable SOLO con data del sheet
const makeCoffeeKey = (row: SheetData) =>
  [
    norm(row.Farm),
    norm(row.Variety),
    norm(row.Process),
    norm(row.Price),
    norm(row["30 KG Sacks"]),
  ].join("|");

const isExclusive = (row: SheetData) => Boolean(norm(row.Group));

const CompareModal = ({
  open,
  onClose,
  left,
  right,
}: {
  open: boolean;
  onClose: () => void;
  left: SheetData;
  right: SheetData;
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
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Compare coffees
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Side-by-side comparison (sheet data only)
            </p>
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

        {/* Body */}
        <div className="p-5">
          {/* Top titles */}
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
          <Row label="24 KG bags" a={left["30 KG Sacks"]} b={right["30 KG Sacks"]} />
          <Row label="Price / kg" a={left.Price} b={right.Price} />
        </div>

        {/* Footer */}
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

  const [data, setData] = useState<SheetData[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);

  // Compare state
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const SHEET_ID = "1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE";
  const API_KEY = "AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k";
  const RANGE = "Sheet1!A:G";

  // 1) Groups desde Firestore (users/{uid}) - igual que ya tenías
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        if (!currentUser?.uid) {
          setUserGroups([]);
          return;
        }

        const db = getFirestore();
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setUserGroups([]);
          return;
        }

        const raw = snap.data()?.groups;

        let groups: string[] = [];

        if (Array.isArray(raw)) {
          groups = raw
            .map((g: any) => {
              if (typeof g === "string") return g.trim();
              if (g && typeof g === "object")
                return String(g.name ?? g.id ?? g.value ?? "").trim();
              return "";
            })
            .filter(Boolean);
        } else if (typeof raw === "string") {
          groups = raw
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
        }

        setUserGroups(groups);
      } catch (e) {
        console.error("Error fetching user groups:", e);
        setUserGroups([]);
      }
    };

    fetchUserGroups();
  }, [currentUser?.uid]);

  // 2) Sheet data
  useEffect(() => {
    const fetchData = async () => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
      try {
        const response = await axios.get(url);
        const rows = response.data.values || [];

        const formattedData: SheetData[] = rows.slice(1).map((row: string[]) => ({
          Farm: row[0] || "",
          Variety: row[1] || "",
          Process: row[2] || "",
          "Our Tasting Notes": row[3] || "",
          "30 KG Sacks": row[4] || "",
          Price: row[5] || "",
          "12 bags Bundle + 1 Free": "",
          Group: (row[6] || "").trim(),
        }));

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // 3) Filtrado por groups (sin cambiar tu lógica)
  const visibleData = useMemo(() => {
    return data.filter((item) => {
      const g = norm(item.Group);
      if (!g) return true;
      return userGroups.some((ug) => norm(ug) === g);
    });
  }, [data, userGroups]);

  // Map para resolver key -> row rápido
  const rowByKey = useMemo(() => {
    const m = new Map<string, SheetData>();
    for (const r of visibleData) m.set(makeCoffeeKey(r), r);
    return m;
  }, [visibleData]);

  const selectedRows = useMemo(() => {
    return selectedKeys.map((k) => rowByKey.get(k)).filter(Boolean) as SheetData[];
  }, [selectedKeys, rowByKey]);

  const toggleSelect = (row: SheetData) => {
    const key = makeCoffeeKey(row);
    setSelectedKeys((prev) => {
      const exists = prev.includes(key);
      if (exists) return prev.filter((k) => k !== key);

      // max 2
      if (prev.length >= 2) {
        // reemplaza el más antiguo (UX simple)
        return [prev[1], key];
      }
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
      {/* Table */}
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
              24 KG Bags
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
                key={key + "|" + index}
                className={[
                  index % 2 === 0 ? "bg-[#c9d3c0]" : "bg-white",
                  "hover:bg-[#e6a318] text-xs",
                  exclusive ? "border-2 border-yellow-500" : "",
                ].join(" ")}
                title={exclusive ? `Exclusive for group: ${row.Group}` : undefined}
              >
                {/* Compare toggle */}
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
                <td className="py-2 px-4 border-b">{row["30 KG Sacks"]}</td>
                <td className="py-2 px-4 border-b">{row.Price}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Sticky compare bar (mobile-friendly) */}
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
                {selectedRows.map((r) => (
                  <span
                    key={makeCoffeeKey(r)}
                    className="text-xs pl-2 pr-1 py-[2px] rounded-full border bg-white border-gray-200 text-gray-700
                               inline-flex items-center gap-2"
                    title={r.Variety}
                  >
                    {r.Variety}
                    <button
                      type="button"
                      onClick={() => toggleSelect(r)}
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
                className="h-9 px-3 rounded-md text-sm font-medium inline-flex items-center gap-2
                           border border-red-200 bg-white text-red-700 hover:bg-red-50"
                title="Clear selection"
              >
                <FontAwesomeIcon icon={faTrash} />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
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
