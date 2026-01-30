import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext"; // <-- ajusta la ruta

interface SheetData {
  Farm: string;
  Variety: string;
  Process: string;
  "Our Tasting Notes": string;
  "30 KG Sacks": string;
  Price: string;
  "12 bags Bundle + 1 Free": string;
  Group?: string;
}

const GoogleSheetTable: React.FC = () => {
  const { currentUser } = useAuth(); // ✅ igual que PlaceOrderForm
  const [data, setData] = useState<SheetData[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);

  const SHEET_ID = "1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE";
  const API_KEY = "AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k";
  const RANGE = "Sheet1!A:G"; // A..G (G = Group)

  const norm = (s: any) => String(s ?? "").trim().toLowerCase();

  // 1) Groups desde Firestore (users/{uid})
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

        // ✅ parse robusto (string / array / objetos)
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
          "12 bags Bundle + 1 Free": "", // estable
          Group: (row[6] || "").trim(),
        }));

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // 3) Filtrado por groups
  const visibleData = useMemo(() => {
    return data.filter((item) => {
      const g = norm(item.Group);
      if (!g) return true; // público
      return userGroups.some((ug) => norm(ug) === g);
    });
  }, [data, userGroups]);

  const isExclusive = (row: SheetData) => Boolean(norm(row.Group));

  return (
    <div className="container mx-auto p-4">
      {/* Debug opcional */}
      {/* <div className="text-xs text-gray-600 mb-2">
        <b>User groups:</b> {userGroups.length ? userGroups.join(", ") : "(none)"}
      </div> */}

      <table className="min-w-full bg-white border border-gray-300">
        <thead className="text-xs">
          <tr>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Farm</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Variety</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Process</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Our Tasting Notes</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">24 KG Bags</th>
            <th className="py-2 px-8 border-b bg-[#9da793] text-center">Price / kg</th>
          </tr>
        </thead>

        <tbody>
          {visibleData.map((row, index) => {
            const exclusive = isExclusive(row);

            return (
              <tr
                key={index}
                className={[
                  index % 2 === 0 ? "bg-[#c9d3c0]" : "bg-white",
                  "hover:bg-[#e6a318] text-xs",
                  // ✅ borde dorado
                  exclusive ? "border-2 border-yellow-500" : "",
                ].join(" ")}
                title={exclusive ? `Exclusive for group: ${row.Group}` : undefined}
              >
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
    </div>
  );
};

export default GoogleSheetTable;
