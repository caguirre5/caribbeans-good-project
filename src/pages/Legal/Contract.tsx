import React, { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import axios from "axios";

interface Replacements {
  ENTITY: string;
  CITY: string;
  COMPNUMBER: string;
  REGISTEREDOFFICE: string;
  CUSTOMERCOMPANYNAME: string;
  NAME: string;
  NUMBER: string;
  EMAIL: string;
  AMOUNT: string;
  VARIETY: string;
  PRICE: string;
  MONTHS: string;
  MONTH1: string;
  YEAR1: string;
  MONTH2: string;
  YEAR2: string;
  FREQUENCY: string;

  // Extras que tu código usa al enviar
  SIGNATORYNAME?: string;
  TOTALAMOUNT?: string;
  BAGS?: string;
  PREFIX?: string;
  DATE?: string;
}

interface Props {
  currentUser: User | null;
}

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

interface CoffeeSelection {
  variety: string;
  amount: number;
  price: number;
}

type PortalUser = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  companyCity?: string;
  companyAddress?: string;
  roles?: string[];
  isActive?: boolean;
};

const initialFormState: Replacements = {
  ENTITY: "",
  CITY: "",
  COMPNUMBER: "",
  REGISTEREDOFFICE: "",
  CUSTOMERCOMPANYNAME: "",
  NAME: "",
  NUMBER: "",
  EMAIL: "",
  AMOUNT: "",
  VARIETY: "",
  PRICE: "",
  MONTHS: "",
  MONTH1: "",
  YEAR1: "",
  MONTH2: "",
  YEAR2: "",
  FREQUENCY: "",
};

// Helpers YYYY-MM y sumar meses
const toYYYYMM = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const addMonths = (base: Date, months: number) =>
  new Date(base.getFullYear(), base.getMonth() + months, 1);

// Rangos permitidos (start entre +1 y +4 meses desde hoy, según tu código original)
const TODAY = new Date();
const MIN_START = addMonths(TODAY, 1);
const MAX_START = addMonths(TODAY, 4);

const MIN_START_STR = toYYYYMM(MIN_START);
const MAX_START_STR = toYYYYMM(MAX_START);

const ContractForm: React.FC<Props> = ({ currentUser }) => {
  const [formData, setFormData] = useState<Replacements>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState<{ [K in keyof Replacements]?: boolean }>(
    {}
  );

  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [coffeeSelections, setCoffeeSelections] = useState<CoffeeSelection[]>(
    []
  );

  // ✅ Admin mode
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<PortalUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedCustomerUid, setSelectedCustomerUid] = useState<string | null>(
    null
  );

  const [isSelfEmployed, setIsSelfEmployed] = useState(true); // true = self-employed (no company number)


  const pricePerKgValue = 24;

  const norm = (s: any) => String(s ?? "").trim().toLowerCase();

  // -------------------------
  // Load sheet data
  // -------------------------
  useEffect(() => {
    const SHEET_ID = "1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE";
    const API_KEY = "AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k";
    const RANGE = "Sheet1!A:G";

    const fetchSheetData = async () => {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        const response = await axios.get(url);
        const rows = response.data.values;

        const formatted: SheetData[] = rows.slice(1).map((row: string[]) => ({
          Farm: row[0] || "",
          Variety: row[1] || "",
          Process: row[2] || "",
          "Our Tasting Notes": row[3] || "",
          "30 KG Sacks": row[4] || "",
          Price: row[5] || "",
          "12 bags Bundle + 1 Free": "",
          Group: (row[6] || "").trim(),
        }));

        setSheetData(formatted);
      } catch (error) {
        console.error("Error loading sheet data:", error);
      }
    };

    fetchSheetData();
  }, []);

  // -------------------------
  // Determine admin from Firestore roles
  // -------------------------
  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser?.uid) {
        setIsAdmin(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const roles = (snap.data()?.roles ?? []) as any[];
        const isAdm = Array.isArray(roles) && roles.includes("admin");
        setIsAdmin(isAdm);
      } catch (e) {
        console.error("Error checking admin:", e);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [currentUser?.uid]);

  // -------------------------
  // Fetch user groups (for sheet filtering)
  // -------------------------
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        if (!currentUser?.uid) {
          setUserGroups([]);
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setUserGroups([]);
          return;
        }

        const raw = snap.data()?.groups;

        const groups = Array.isArray(raw)
          ? raw.map((g: any) => String(g).trim()).filter(Boolean)
          : [];

        setUserGroups(groups);
      } catch (e) {
        console.error("Error fetching user groups:", e);
        setUserGroups([]);
      }
    };

    fetchUserGroups();
  }, [currentUser?.uid]);

  // -------------------------
  // Admin: fetch all users from backend (same endpoint you already use)
  // -------------------------
  useEffect(() => {
    const fetchUsersForAdmin = async () => {
      if (!isAdmin || !currentUser) return;

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();

        const normalized: PortalUser[] = (Array.isArray(data) ? data : [])
          .filter((u) => u?.uid && u?.email)
          .map((u) => ({
            uid: u.uid,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            phoneNumber: u.phoneNumber,
            company: u.company,
            companyCity: u.companyCity,
            companyAddress: u.companyAddress,
            roles: u.roles,
            isActive: u.isActive,
          }));

        setAllUsers(normalized);
      } catch (e) {
        console.error("Error fetching users for admin:", e);
        setAllUsers([]);
      }
    };

    fetchUsersForAdmin();
  }, [isAdmin, currentUser]);

  // -------------------------
  // Filter sheet data by group
  // -------------------------
  const visibleSheetData = useMemo(() => {
    return sheetData.filter((item) => {
      const g = norm(item.Group);
      if (!g) return true;
      return userGroups.some((ug) => norm(ug) === g);
    });
  }, [sheetData, userGroups]);

  // -------------------------
  // Admin: filtered customer list based on search
  // -------------------------
  const filteredCustomers = useMemo(() => {
    if (!isAdmin) return [];

    const q = userSearch.trim().toLowerCase();
    const list = allUsers.filter((u) => u.isActive !== false);

    if (!q) return list.slice(0, 30);

    return list
      .filter((u) => {
        const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 30);
  }, [isAdmin, allUsers, userSearch]);


// -------------------------
// Fill form fields (normal user OR admin-selected user)
// -------------------------
  useEffect(() => {
    const fill = async () => {
      if (!currentUser?.uid) return;

      // ✅ Admin: solo llenar si ya eligió customer
      if (isAdmin) {
        if (!selectedCustomerUid) return;

        const selected = allUsers.find((u) => u.uid === selectedCustomerUid);
        if (!selected) return;

        const fullName = `${selected.firstName || ""} ${selected.lastName || ""}`.trim();

        setFormData((prev) => ({
          ...prev,
          ENTITY: selected.company || "",
          CITY: selected.companyCity || "",
          REGISTEREDOFFICE: selected.companyAddress || "",
          CUSTOMERCOMPANYNAME: selected.company || "",
          NAME: fullName,
          EMAIL: selected.email || "",
          NUMBER: selected.phoneNumber || "",
          SIGNATORYNAME: fullName,
        }));
        return;
      }

      // ✅ Normal user: llenar desde Firestore
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const u = userSnap.data();
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();

        setFormData((prev) => ({
          ...prev,
          ENTITY: u.company || "",
          CITY: u.companyCity || "",
          REGISTEREDOFFICE: u.companyAddress || "",
          CUSTOMERCOMPANYNAME: u.company || "",
          NAME: fullName,
          EMAIL: u.email || currentUser.email || "",
          NUMBER: u.phoneNumber || "",
          SIGNATORYNAME: fullName,
        }));
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fill();
    // 👇 IMPORTANTE: NO uses `currentUser` (objeto) como dependencia
  }, [currentUser?.uid, isAdmin, selectedCustomerUid, allUsers]);


  // -------------------------
  // Handlers
  // -------------------------
  const handleVarietySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = visibleSheetData.find(
      (item) => `${item.Variety} (${item.Farm})` === e.target.value
    );

    if (selected) {
      const pricePerKg =
        parseFloat(String(selected.Price).replace("£", "").trim()) || 0;
      const availableBags = parseInt(String(selected["30 KG Sacks"]), 10) || 0;

      setStockAvailable(availableBags);

      setFormData((prev) => ({
        ...prev,
        VARIETY: e.target.value,
        PRICE: pricePerKg.toString(),
      }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(e.target.value, 10);

    if (stockAvailable !== null && amount > stockAvailable) {
      alert(`Only ${stockAvailable} bags available.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      AMOUNT: e.target.value,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelfEmployedChange = (value: boolean) => {
    setIsSelfEmployed(value);

    // si es self-employed, el campo no aplica
    if (value) {
      setFormData((prev) => ({ ...prev, COMPNUMBER: "" }));
      setErrors((prev) => ({ ...prev, COMPNUMBER: false }));
    }
  };


  const calculateReservationPeriod = (start: string, end: string) => {
    if (!start || !end) return;

    const [startYear, startMonth] = start.split("-").map(Number);
    const [endYear, endMonth] = end.split("-").map(Number);

    const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const startFormatted = `${monthNames[startMonth - 1]}`.toLowerCase();
    const endFormatted = `${monthNames[endMonth - 1]}`.toLowerCase();

    const updatedFields = {
      MONTHS: months.toString(),
      MONTH1: startFormatted,
      YEAR1: String(startYear),
      MONTH2: endFormatted,
      YEAR2: String(endYear),
    };

    setFormData((prev) => ({ ...prev, ...updatedFields }));
  };

  const validateForm = () => {
    const newErrors: { [K in keyof Replacements]?: boolean } & {
      COFFEE?: boolean;
    } = {};

    const requiredKeys: (keyof Replacements)[] = [
      "NAME",
      "CITY",
      "REGISTEREDOFFICE",
      "CUSTOMERCOMPANYNAME",
      "NUMBER",
      "EMAIL",
      "FREQUENCY",
    ];

    for (const k of requiredKeys) {
      const v = String(formData[k] ?? "").trim();
      if (!v) newErrors[k] = true;
    }

    // ✅ solo requerido si NO es self-employed
    if (!isSelfEmployed) {
      const v = String(formData.COMPNUMBER ?? "").trim();
      if (!v) newErrors.COMPNUMBER = true;
    }

    if (coffeeSelections.length === 0) {
      newErrors.COFFEE = true;
    }

    setErrors(newErrors as any);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const isValid = validateForm();
    if (!isValid) {
      setLoading(false);
      setMessage("Please fill out all required fields.");
      return;
    }

    if (!startDate || startDate < MIN_START_STR || startDate > MAX_START_STR) {
      setLoading(false);
      setMessage("Please choose a start month between 3 and 6 months from now.");
      return;
    }

    if (!endDate || endDate < startDate) {
      setLoading(false);
      setMessage("End month must be the same or after the start month.");
      return;
    }

    const todayUK = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const varietySummary = coffeeSelections
      .map(
        (item) =>
          `${item.amount} ${
            item.amount === 1 ? "bag" : "bags"
          } 24 kg each of ${item.variety} green coffee beans equivalent to ${
            item.amount * 24
          } kg of ${item.variety} green coffee`
      )
      .join("; ");

    const priceBreakdown = coffeeSelections
      .map((item) => `${item.variety} – £${item.price.toFixed(2)}`)
      .join("; ");

    const replacementsToSend = {
      ...formData,
      ENTITY: formData.CUSTOMERCOMPANYNAME,
      SIGNATORYNAME: formData.NAME,
      TOTALAMOUNT: coffeeSelections
        .reduce((acc, item) => acc + item.amount * 24 * item.price, 0)
        .toFixed(2),
      VARIETY: varietySummary,
      PRICE: priceBreakdown,
      BAGS:
        coffeeSelections.reduce((acc, item) => acc + item.amount, 0) === 1
          ? "bag"
          : "bags",
      PREFIX: formData.FREQUENCY === "annually" ? "an" : "a",
      DATE: todayUK,
      COMPNUMBER: isSelfEmployed ? "" : formData.COMPNUMBER,
    };

    try {
      const token = await currentUser?.getIdToken();

      // ✅ Contract owner: selected customer uid if admin, else current user uid
      const contractUserId =
        isAdmin && selectedCustomerUid ? selectedCustomerUid : currentUser?.uid;

      // DOCX
      const response = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/docx/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            replacements: replacementsToSend,
            contractUserId, // opcional si tu backend lo usa
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error generating contract");

      // Firestore contract via backend
      try {
        const totalAmountNumber = coffeeSelections.reduce(
          (acc, item) => acc + item.amount * 24 * item.price,
          0
        );
        const totalKgNumber = coffeeSelections.reduce(
          (acc, item) => acc + item.amount * 24,
          0
        );

        const simpleContractPayload = {
          name: formData.NAME,
          email: formData.EMAIL,
          status: "pending",
          userId: contractUserId,
          createdByAdmin: isAdmin ? currentUser?.uid : null,
          details: {
            customer: {
              entity: formData.CUSTOMERCOMPANYNAME,
              city: formData.CITY,
              companyNumber: formData.COMPNUMBER,
              officeAddress: formData.REGISTEREDOFFICE,
              fullName: formData.NAME,
              phone: formData.NUMBER,
              email: formData.EMAIL,
            },
            reservation: {
              startMonth: startDate,
              endMonth: endDate,
              months: formData.MONTHS,
              month1: formData.MONTH1,
              year1: formData.YEAR1,
              month2: formData.MONTH2,
              year2: formData.YEAR2,
              frequency: formData.FREQUENCY,
              generatedAtUK: todayUK,
            },
            selections: coffeeSelections.map((s) => ({
              variety: s.variety,
              bags: s.amount,
              unitPricePerKg: s.price,
              lineKg: s.amount * 24,
              lineSubtotal: s.amount * 24 * s.price,
              remainingBags: s.amount,
              remainingKg: s.amount * 24,
            })),
            totals: {
              totalKg: totalKgNumber,
              totalAmountGBP: Number(totalAmountNumber.toFixed(2)),
              pricePerBagKg: 24,
            },
            replacementsSnapshot: replacementsToSend,
          },
        };

        await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/contracts/addSimple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(simpleContractPayload),
        }).catch((e) => {
          console.error("Failed to create Firestore contract:", e);
        });
      } catch (e) {
        console.error("Simple contract creation failed:", e);
      }

      // Admin email dispatch (igual que tu código original)
      try {
        const adminEmails = ["caguirre.dt@gmail.com", "info@caribbeangoods.co.uk"];

        const customerName = formData.NAME || "(No name)";
        const customerEmail = formData.EMAIL || "(No email)";
        const totalAmount = coffeeSelections
          .reduce((acc, item) => acc + item.amount * 24 * item.price, 0)
          .toFixed(2);

        const msg =
          `A new contract has been created and sent to the customer.\n\n` +
          `Customer: ${customerName}\n` +
          `Email: ${customerEmail}\n` +
          `Total: £${totalAmount}\n\n` +
          `Please review it in the admin dashboard.`;

        await Promise.all(
          adminEmails.map(async (email) => {
            try {
              await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendEmailMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipientEmail: email,
                  subject: "New Contract Created",
                  message: msg,
                }),
              });
              console.log(`✅ Email sent to ${email}`);
            } catch (err) {
              console.error(`❌ Failed to send email to ${email}:`, err);
            }
          })
        );
      } catch (e) {
        console.error("Admin email dispatch failed:", e);
      }

      setMessage(result.message || "Contract succesfully generated");
      setSuccess(true);
    } catch (error: any) {
      console.error("❌ Error sending:", error);
      setMessage(error.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
return (
  <div className="w-full h-full">
    {success ? (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="text-center text-gray-800">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Contract Sent!
          </h2>
          <p className="mb-2">
            To complete your order, please follow these simple steps:
          </p>
          <ol className="list-decimal list-inside text-left max-w-md mx-auto space-y-2">
            <li>Check your email inbox — we’ve just sent you the contract.</li>
            <li>Download the attached contract file.</li>
            <li>Sign the contract (you can sign it digitally or by hand).</li>
            <li>
              Send the signed contract to{" "}
              <strong>info@caribbeangoods.co.uk</strong>.
            </li>
          </ol>
          <p className="mt-4 font-medium text-red-600">
            Please note: your order is not complete yet.
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Once you’ve completed all the steps and sent the signed contract by
            email, our team will review it. If everything is correct, we’ll
            approve it and confirm that your order is officially accepted.
          </p>
        </div>
      </div>
    ) : (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold">Legal agreement</h2>
          </div>

          {/* ✅ Admin selector */}
          {isAdmin && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
              <div className="text-sm font-semibold text-amber-900">
                Admin mode — Create contract for a customer
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-sm">
                    Search customer
                  </label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-sm">
                    Select customer
                  </label>
                  <select
                    value={selectedCustomerUid || ""}
                    onChange={(e) =>
                      setSelectedCustomerUid(e.target.value || null)
                    }
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">-- Select a customer --</option>
                    {filteredCustomers.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {(u.firstName || "").trim()}{" "}
                        {(u.lastName || "").trim()} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-amber-800 mt-2">
                Selecting a customer will auto-fill the form and assign the
                contract to that user.
              </p>
            </div>
          )}

          {/* Customer Details */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Details</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="block font-medium mb-1 text-sm">
                  Full Name
                </label>
                <input
                  type="text"
                  name="NAME"
                  value={formData.NAME}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-lg px-3 py-2 border ${
                    errors["NAME"] ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">City</label>
                <input
                  type="text"
                  name="CITY"
                  value={formData.CITY}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-lg px-3 py-2 border ${
                    errors["CITY"] ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block font-medium mb-2 text-sm">
                  Are you self employed?
                </label>

                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="radio"
                      name="selfEmployed"
                      checked={isSelfEmployed === true}
                      onChange={() => handleSelfEmployedChange(true)}
                      className="accent-emerald-600"
                    />
                    <span>Yes</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="radio"
                      name="selfEmployed"
                      checked={isSelfEmployed === false}
                      onChange={() => handleSelfEmployedChange(false)}
                      className="accent-emerald-600"
                    />
                    <span>No</span>
                  </label>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  If you select “No”, we’ll ask for your Registration Company Number.
                </p>
              </div>

              {/* ✅ Solo mostrar si NO es self-employed */}
              {!isSelfEmployed && (
                <div>
                  <label className="block font-medium mb-1 text-sm leading-tight">
                    Registration Company Number
                  </label>
                  <input
                    type="text"
                    name="COMPNUMBER"
                    value={formData.COMPNUMBER}
                    onChange={handleChange}
                    className={`w-full rounded-lg px-3 py-2 border ${
                      errors["COMPNUMBER"] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
              )}


              <div className="lg:col-span-2">
                <label className="block font-medium mb-1 text-sm">
                  Office Address
                </label>
                <input
                  type="text"
                  name="REGISTEREDOFFICE"
                  value={formData.REGISTEREDOFFICE}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-lg px-3 py-2 border ${
                    errors["REGISTEREDOFFICE"]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block font-medium mb-1 text-sm">
                  Customer Company Name
                </label>
                <input
                  type="text"
                  name="CUSTOMERCOMPANYNAME"
                  value={formData.CUSTOMERCOMPANYNAME}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-lg px-3 py-2 border ${
                    errors["CUSTOMERCOMPANYNAME"]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">Phone</label>
                <input
                  type="text"
                  name="NUMBER"
                  value={formData.NUMBER}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-lg px-3 py-2 border ${
                    errors["NUMBER"] ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">Email</label>
                <input
                  type="email"
                  name="EMAIL"
                  value={formData.EMAIL}
                  onChange={handleChange}
                  disabled={!isAdmin}
                  required
                  className={`w-full rounded-lg px-3 py-2 border ${
                    errors["EMAIL"] ? "border-red-500" : "border-gray-300"
                  } ${!isAdmin ? "bg-gray-100" : "bg-white"}`}
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Order Details */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Order Details</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <label className="block font-medium mb-1 text-sm">
                  Select a coffee
                </label>
                <select
                  name="VARIETY"
                  value={formData.VARIETY}
                  onChange={handleVarietySelect}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">-- Select a coffee --</option>
                  {visibleSheetData.map((item, i) => {
                    const stockBags =
                      parseInt(item["30 KG Sacks"] as any, 10) || 0;
                    const isSoldOut = stockBags <= 0;
                    const value = `${item.Variety} (${item.Farm})`;

                    return (
                      <option key={i} value={value} disabled={isSoldOut}>
                        {item.Variety} ({item.Farm}) - {item.Process}
                        {isSoldOut ? " — SOLD OUT" : ""}
                      </option>
                    );
                  })}
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Sold out coffees are shown as “SOLD OUT” and cannot be
                  selected.
                </p>
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  Bags (24kg each)
                </label>
                <input
                  type="number"
                  name="AMOUNT"
                  value={formData.AMOUNT}
                  onChange={handleAmountChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min={1}
                />
                {stockAvailable !== null && (
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {stockAvailable} bags
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  Unit Price (£/kg)
                </label>
                <input
                  type="text"
                  name="PRICE"
                  value={formData.PRICE}
                  disabled
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  Subtotal for this selection (£)
                </label>
                <input
                  type="text"
                  value={
                    formData.AMOUNT && formData.PRICE
                      ? (
                          parseInt(formData.AMOUNT, 10) *
                          pricePerKgValue *
                          parseFloat(formData.PRICE)
                        ).toFixed(2)
                      : "0.00"
                  }
                  disabled
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
                />
              </div>

              <div className="lg:col-span-3">
                <button
                  type="button"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-auto"
                  onClick={() => {
                    const varietyExists = coffeeSelections.some(
                      (sel) => sel.variety === formData.VARIETY
                    );
                    if (varietyExists) {
                      alert("This variety has already been added.");
                      return;
                    }

                    if (!formData.VARIETY || !formData.AMOUNT || !formData.PRICE) {
                      alert("Please complete all fields before adding.");
                      return;
                    }

                    setCoffeeSelections((prev) => [
                      ...prev,
                      {
                        variety: formData.VARIETY,
                        amount: parseInt(formData.AMOUNT, 10),
                        price: parseFloat(formData.PRICE),
                      },
                    ]);

                    setFormData((prev) => ({
                      ...prev,
                      VARIETY: "",
                      AMOUNT: "",
                      PRICE: "",
                    }));

                    setStockAvailable(null);
                  }}
                >
                  Add coffee
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Selected items */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h4 className="font-semibold mb-2 text-gray-800">
                  Selected Coffees
                </h4>

                {coffeeSelections.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No coffees added yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-800">
                    {coffeeSelections.map((item, idx) => (
                      <li
                        key={idx}
                        className="relative border border-gray-200 rounded-lg px-4 py-3 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setCoffeeSelections((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-lg font-bold"
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          ×
                        </button>

                        <div className="font-semibold pr-6">{item.variety}</div>

                        <div className="text-gray-700 text-sm mt-1">
                          {item.amount} bags × £{item.price} = £
                          {(item.amount * pricePerKgValue * item.price).toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Totals */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <h4 className="font-semibold mb-3 text-gray-800">Totals</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block font-medium mb-1 text-sm">
                      Estimated Total Price (£)
                    </label>
                    <input
                      type="text"
                      value={coffeeSelections
                        .reduce(
                          (acc, item) =>
                            acc + item.amount * pricePerKgValue * item.price,
                          0
                        )
                        .toFixed(2)}
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-sm">
                      Total KG
                    </label>
                    <input
                      type="text"
                      value={`${coffeeSelections.reduce(
                        (acc, item) => acc + item.amount * pricePerKgValue,
                        0
                      )} kg`}
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Reservation Period */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Reservation Period</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1 text-sm">
                  Start Month
                </label>
                <input
                  type="month"
                  value={startDate}
                  min={MIN_START_STR}
                  max={MAX_START_STR}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v && v < MIN_START_STR) v = MIN_START_STR;
                    if (v && v > MAX_START_STR) v = MAX_START_STR;

                    setStartDate(v);

                    if (endDate && v && endDate < v) {
                      setEndDate(v);
                    }
                    calculateReservationPeriod(v, endDate);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  End Month
                </label>
                <input
                  type="month"
                  value={endDate}
                  min={(() => {
                    const now = new Date();
                    now.setMonth(now.getMonth() + 1);
                    return `${now.getFullYear()}-${String(
                      now.getMonth() + 1
                    ).padStart(2, "0")}`;
                  })()}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (startDate && v < startDate) v = startDate;
                    setEndDate(v);
                    calculateReservationPeriod(startDate, v);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              You can start your reservation between <b>{MIN_START_STR}</b> and{" "}
              <b>{MAX_START_STR}</b>.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1 text-sm">
                  Total Duration (in months)
                </label>
                <input
                  type="text"
                  value={formData.MONTHS}
                  disabled
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Delivery Frequency */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery Frequency</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1 text-sm">
                  Select delivery frequency
                </label>
                <select
                  name="FREQUENCY"
                  value={formData.FREQUENCY}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-lg px-3 py-2 border bg-white ${
                    errors.FREQUENCY ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">-- Select an option --</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
          </section>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-auto"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate contract"}
            </button>

            {message && (
              <p className="mt-3 text-center text-sm text-green-600">
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    )}
  </div>
);

};

export default ContractForm;
