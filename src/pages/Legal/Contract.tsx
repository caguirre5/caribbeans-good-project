import React, { useEffect, useMemo, useState } from "react";
import { User } from "firebase/auth";
import { db } from "../../firebase/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { fetchReadableInventoryDocs } from "../../utils/inventoryVisibility";

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
  id?: string;
  Farm: string;
  Variety: string;
  Process: string;
  "Our Tasting Notes": string;
  "30 KG Sacks": string;
  Price: string;
  "12 bags Bundle + 1 Free": string;
  Group?: string;
  groupNames?: string[];
  isActive?: boolean;
  bagKg?: number;
}

interface CoffeeSelection {
  inventoryItemId?: string | null;
  variety: string;
  amount: number;
  price: number;
  basePrice?: number;
  bagKg?: number;
  clientKey?: string;
  priceSource?: "default" | "manual" | "general";
  discountPercent?: number;
}

type CompanyDoc = {
  id: string;
  name: string;
  slug?: string;
};

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
  companyIds?: string[];
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
  const [generalDiscountPercent, setGeneralDiscountPercent] = useState("");
  const [generalDiscountSelection, setGeneralDiscountSelection] = useState<Record<string, boolean>>({});

  // ✅ Admin mode
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [allUsers, setAllUsers] = useState<PortalUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedCustomerUid, setSelectedCustomerUid] = useState<string | null>(
    null
  );
  const [showCustomerOptions, setShowCustomerOptions] = useState(false);
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [shareWithCompany, setShareWithCompany] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  const [isSelfEmployed, setIsSelfEmployed] = useState(true); // true = self-employed (no company number)

  const monthOptions = useMemo(() => {
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
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 3;
    const endYear = currentYear + 10;
    const options: { value: string; label: string }[] = [];

    for (let year = startYear; year <= endYear; year += 1) {
      monthNames.forEach((month, index) => {
        options.push({
          value: `${year}-${String(index + 1).padStart(2, "0")}`,
          label: `${month} ${year}`,
        });
      });
    }

    return options;
  }, []);
  const toNum = (value: unknown, fallback = 0) => {
    const n =
      typeof value === "number"
        ? value
        : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };

  const DEFAULT_BAG_KG = 24;
  const selectionBagKg = (item: Pick<CoffeeSelection, "bagKg">) =>
    toNum(item.bagKg, DEFAULT_BAG_KG);
  const formatGBP = (value: number) => `GBP ${value.toFixed(2)}`;
  const selectionKeyFor = (item: CoffeeSelection, index: number) =>
    item.clientKey || `${item.inventoryItemId || item.variety}-${index}`;
  const basePriceFor = (item: CoffeeSelection) => toNum(item.basePrice, item.price);
  const isManualPriced = (item: CoffeeSelection) => item.priceSource === "manual";
  const canUseGeneralDiscount = (item: CoffeeSelection) =>
    !isManualPriced(item) && basePriceFor(item) > 0;

  const customerLabel = (user: PortalUser) => {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return `${name || "Unnamed customer"} - ${user.email}`;
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
        .map((g) => g.trim())
        .filter(Boolean);
    }

    return [];
  };

  const normalizeIds = (raw: any) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((value) => String(value || "").trim()).filter(Boolean);
  };

  const [hasCredit, setHasCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");

  // -------------------------
  // Load inventory data
  // -------------------------
  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!currentUser?.uid) {
        setSheetData([]);
        return;
      }

      try {
        const inventoryDocs = await fetchReadableInventoryDocs(db, {
          isAdmin,
          currentUserId: currentUser.uid,
        });
        const formatted: SheetData[] = inventoryDocs.map((docSnap) => {
          const row = docSnap.data() as any;
          const groupNames = normalizeGroups(row.groupNames);
          const harvestYear = String(row.harvestYear ?? "").trim();
          const variety = String(row.variety ?? "").trim();
          const sellableBags = Math.max(0, toNum(row.availableBags) - toNum(row.reservedBags));

          return {
            id: docSnap.id,
            Farm: String(row.farm ?? "").trim(),
            Variety: harvestYear ? `${harvestYear} - ${variety}` : variety,
            Process: String(row.process ?? "").trim(),
            "Our Tasting Notes": String(row.tastingNotes ?? "").trim(),
            "30 KG Sacks": String(sellableBags),
            Price: toNum(row.pricePerKg).toString(),
            "12 bags Bundle + 1 Free": "",
            Group: groupNames.join(", "),
            groupNames,
            isActive: row.isActive !== false,
            bagKg: toNum(row.bagSizeKg, 24),
          };
        });

        setSheetData(formatted);
      } catch (error) {
        console.error("Error loading inventory data:", error);
      }
    };

    fetchInventoryData();
  }, [currentUser?.uid, isAdmin, userGroups]);

  // -------------------------
  // Determine admin from Firestore roles
  // -------------------------
  useEffect(() => {
    const checkAdmin = async () => {
      setAdminChecked(false);
      if (!currentUser?.uid) {
        setIsAdmin(false);
        setAdminChecked(true);
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
      } finally {
        setAdminChecked(true);
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

        setUserGroups(normalizeGroups(snap.data()?.groups));
      } catch (e) {
        console.error("Error fetching user groups:", e);
        setUserGroups([]);
      }
    };

    fetchUserGroups();
  }, [currentUser?.uid]);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAdmin) {
        setCompanies([]);
        return;
      }

      try {
        const snap = await getDocs(query(collection(db, "companies"), orderBy("name")));
        setCompanies(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as any),
          }))
        );
      } catch (e) {
        console.error("Error fetching companies:", e);
        setCompanies([]);
      }
    };

    fetchCompanies();
  }, [isAdmin]);
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
            companyIds: normalizeIds(u.companyIds),
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
      const availableBags = toNum(item["30 KG Sacks"]);
      if (item.isActive === false || availableBags <= 0) return false;
      return true;
    });
  }, [sheetData]);

  const selectedCoffeeForPricing = useMemo(
    () =>
      visibleSheetData.find(
        (item) => `${item.Variety} (${item.Farm})` === formData.VARIETY
      ) || null,
    [visibleSheetData, formData.VARIETY]
  );
  const selectedBasePrice = toNum(selectedCoffeeForPricing?.Price);
  const currentUnitPrice = toNum(formData.PRICE);
  const currentDiscountPerKg =
    selectedBasePrice > 0 && currentUnitPrice > 0 && currentUnitPrice < selectedBasePrice
      ? selectedBasePrice - currentUnitPrice
      : 0;
  const currentDiscountPercent =
    currentDiscountPerKg > 0 ? (currentDiscountPerKg / selectedBasePrice) * 100 : 0;
  const selectedGeneralDiscountCount = coffeeSelections.filter(
    (item, index) =>
      canUseGeneralDiscount(item) && generalDiscountSelection[selectionKeyFor(item, index)]
  ).length;

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

  const selectedCustomer = useMemo(() => {
    if (!isAdmin || !selectedCustomerUid) return null;
    return allUsers.find((u) => u.uid === selectedCustomerUid) || null;
  }, [isAdmin, selectedCustomerUid, allUsers]);

  const selectedCustomerCompanies = useMemo(() => {
    const ids = new Set(selectedCustomer?.companyIds || []);
    return companies.filter((company) => ids.has(company.id));
  }, [companies, selectedCustomer]);

  const selectedCompanies = useMemo(
    () => selectedCustomerCompanies.filter((company) => selectedCompanyIds.includes(company.id)),
    [selectedCompanyIds, selectedCustomerCompanies]
  );

  useEffect(() => {
    setShareWithCompany(false);
    setSelectedCompanyIds([]);
  }, [selectedCustomer?.uid]);


// -------------------------
// Fill form fields (normal user OR admin-selected user)
// -------------------------
  useEffect(() => {
    const fill = async () => {
      if (!currentUser?.uid) return;

      // ✅ Admin: solo llenar si ya eligió customer
      if (isAdmin) {
        if (!selectedCustomer) return;

        const fullName = `${selectedCustomer.firstName || ""} ${selectedCustomer.lastName || ""}`.trim();

        setFormData((prev) => ({
          ...prev,
          ENTITY: selectedCustomer.company || "",
          CITY: selectedCustomer.companyCity || "",
          REGISTEREDOFFICE: selectedCustomer.companyAddress || "",
          CUSTOMERCOMPANYNAME: selectedCustomer.company || "",
          NAME: fullName,
          EMAIL: selectedCustomer.email || "",
          NUMBER: selectedCustomer.phoneNumber || "",
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
  }, [currentUser?.uid, isAdmin, selectedCustomer]);


  // -------------------------
  // Handlers
  // -------------------------
  const handleVarietySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = visibleSheetData.find(
      (item) => `${item.Variety} (${item.Farm})` === e.target.value
    );

    if (selected) {
      const pricePerKg = toNum(selected.Price);
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

    if (months <= 0) {
      setFormData((prev) => ({
        ...prev,
        MONTHS: "",
        MONTH1: "",
        YEAR1: "",
        MONTH2: "",
        YEAR2: "",
      }));
      return;
    }

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

    if (isAdmin && !selectedCustomer) {
      setLoading(false);
      setMessage("Please select a customer before creating the contract.");
      return;
    }

    const isValid = validateForm();
    if (!isValid) {
      setLoading(false);
      setMessage("Please fill out all required fields.");
      return;
    }

    if (!startDate) {
      setLoading(false);
      setMessage("Please choose a start month.");
      return;
    }

    if (!endDate) {
      setLoading(false);
      setMessage("Please choose an end month.");
      return;
    }

    if (endDate < startDate) {
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
        (item) => {
          const bagKg = selectionBagKg(item);
          return `${item.amount} ${
            item.amount === 1 ? "bag" : "bags"
          } ${bagKg} kg each of ${item.variety} green coffee beans equivalent to ${
            item.amount * bagKg
          } kg of ${item.variety} green coffee`
        }
      )
      .join("; ");

    const priceBreakdown = coffeeSelections
      .map((item) => `${item.variety} - ${formatGBP(item.price)}`)
      .join("; ");

    const replacementsToSend = {
      ...formData,
      ENTITY: formData.CUSTOMERCOMPANYNAME,
      SIGNATORYNAME: formData.NAME,
      TOTALAMOUNT: coffeeSelections
        .reduce((acc, item) => acc + item.amount * selectionBagKg(item) * item.price, 0)
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
          (acc, item) => acc + item.amount * selectionBagKg(item) * item.price,
          0
        );
        const totalKgNumber = coffeeSelections.reduce(
          (acc, item) => acc + item.amount * selectionBagKg(item),
          0
        );
        const selectedBagSizes = Array.from(
          new Set(coffeeSelections.map((item) => selectionBagKg(item)))
        );

        const companySharingEnabled = isAdmin && shareWithCompany && selectedCompanies.length > 0;
        const primaryCompany = companySharingEnabled ? selectedCompanies[0] : null;
        const companySharing = companySharingEnabled
          ? {
              sharedWithCompany: true,
              companyId: primaryCompany?.id || null,
              companyName: selectedCompanies.map((company) => company.name).join(", "),
              companyAccessIds: selectedCompanies.map((company) => company.id),
            }
          : {
              sharedWithCompany: false,
              companyId: null,
              companyName: null,
              companyAccessIds: [],
            };
        const simpleContractPayload = {
          name: formData.NAME,
          email: formData.EMAIL,
          status: "pending",
          userId: contractUserId,
          createdByAdmin: isAdmin ? currentUser?.uid : null,
          ...companySharing,
          details: {
            company: companySharing,
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
            selections: coffeeSelections.map((s) => {
              const bagKg = selectionBagKg(s);
              return {
                inventoryItemId: s.inventoryItemId || null,
                variety: s.variety,
                bags: s.amount,
                bagKg,
                unitPricePerKg: s.price,
                lineKg: s.amount * bagKg,
                lineSubtotal: s.amount * bagKg * s.price,
                remainingBags: s.amount,
                remainingKg: s.amount * bagKg,
              };
            }),
            totals: {
              totalKg: totalKgNumber,
              totalAmountGBP: Number(totalAmountNumber.toFixed(2)),
              pricePerBagKg: selectedBagSizes.length === 1 ? selectedBagSizes[0] : null,
              bagSizesKg: selectedBagSizes,
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

      setMessage(result.message || "Contract succesfully generated");
      setSuccess(true);
    } catch (error: any) {
      console.error("❌ Error sending:", error);
      setMessage(error.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };
  const applyGeneralDiscountToSelected = () => {
    const percent = toNum(generalDiscountPercent);

    if (percent <= 0 || percent >= 100) {
      alert("Enter a discount percentage between 0 and 100.");
      return;
    }

    if (selectedGeneralDiscountCount === 0) {
      alert("Select at least one default-priced coffee for the general discount.");
      return;
    }

    setCoffeeSelections((prev) =>
      prev.map((item, index) => {
        const key = selectionKeyFor(item, index);
        if (!generalDiscountSelection[key] || !canUseGeneralDiscount(item)) return item;

        const basePrice = basePriceFor(item);
        const discountedPrice = Number((basePrice * (1 - percent / 100)).toFixed(2));

        return {
          ...item,
          price: discountedPrice,
          basePrice,
          priceSource: "general",
          discountPercent: percent,
        };
      })
    );
  };

  const clearGeneralDiscountFromSelected = () => {
    setCoffeeSelections((prev) =>
      prev.map((item, index) => {
        const key = selectionKeyFor(item, index);
        if (!generalDiscountSelection[key] || isManualPriced(item)) return item;

        const basePrice = basePriceFor(item);
        return {
          ...item,
          price: basePrice,
          basePrice,
          priceSource: "default",
          discountPercent: 0,
        };
      })
    );
  };

  // -------------------------
  // UI
  // -------------------------
  if (!adminChecked) {
    return (
      <div className="w-full h-full">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <p className="text-sm font-medium text-gray-700">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full h-full">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#044421]/70">
            Contract requests
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#044421]">
            Please contact us to arrange a coffee contract
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-700">
            Contract creation is handled directly by the Caribbean Goods team so
            we can confirm availability, reservation dates, pricing, delivery
            needs, and any details specific to your business before preparing the
            agreement.
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-700">
            If you would like to reserve coffee or discuss a supply agreement,
            please contact us at{" "}
            <a
              href="mailto:info@caribbeangoods.co.uk"
              className="font-semibold text-[#044421] underline underline-offset-4"
            >
              info@caribbeangoods.co.uk
            </a>
            . We will be happy to help you review the available coffees and set
            up the right contract.
          </p>
        </div>
      </div>
    );
  }

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

              <div className="mt-3">
                <div className="relative">
                  <label className="block font-medium mb-1 text-sm text-amber-900">
                    Customer
                  </label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedCustomerUid(null);
                      setShowCustomerOptions(true);
                    }}
                    onFocus={() => setShowCustomerOptions(true)}
                    onBlur={() => window.setTimeout(() => setShowCustomerOptions(false), 150)}
                    placeholder="Search by name or email..."
                    role="combobox"
                    aria-expanded={showCustomerOptions}
                    aria-controls="contract-customer-options"
                    className="w-full border border-amber-200 rounded-xl px-3 py-2.5 bg-white"
                  />

                  {showCustomerOptions && (
                    <div
                      id="contract-customer-options"
                      role="listbox"
                      className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-amber-200 bg-white shadow-lg"
                    >
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((u) => (
                          <button
                            key={u.uid}
                            type="button"
                            role="option"
                            aria-selected={selectedCustomerUid === u.uid}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedCustomerUid(u.uid);
                              setUserSearch(customerLabel(u));
                              setShowCustomerOptions(false);
                            }}
                            className={
                              "block w-full px-3 py-2.5 text-left text-sm transition " +
                              (selectedCustomerUid === u.uid
                                ? "bg-emerald-50 text-emerald-900"
                                : "text-gray-800 hover:bg-amber-50")
                            }
                          >
                            <span className="block font-semibold">
                              {`${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                                "Unnamed customer"}
                            </span>
                            <span className="block text-xs text-gray-500">{u.email}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-gray-500">
                          No customers found.
                        </div>
                      )}
                    </div>
                  )}

                  {selectedCustomer && (
                    <p className="mt-2 text-xs font-semibold text-emerald-800">
                      Selected: {customerLabel(selectedCustomer)}
                    </p>
                  )}
                </div>
              </div>

              {selectedCustomer && selectedCustomerCompanies.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-white/75 p-3">
                  <label className="flex items-start gap-2 text-sm font-semibold text-amber-950">
                    <input
                      type="checkbox"
                      checked={shareWithCompany}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShareWithCompany(checked);
                        setSelectedCompanyIds(checked ? [selectedCustomerCompanies[0].id] : []);
                      }}
                      className="mt-1 accent-emerald-600"
                    />
                    <span>Share this contract with specific company access</span>
                  </label>

                  {shareWithCompany && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {selectedCustomerCompanies.map((company) => {
                        const checked = selectedCompanyIds.includes(company.id);
                        return (
                          <label
                            key={company.id}
                            className={[
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                              checked
                                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                                : "border-amber-200 bg-white text-gray-700",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setSelectedCompanyIds((prev) =>
                                  e.target.checked
                                    ? Array.from(new Set([...prev, company.id]))
                                    : prev.filter((id) => id !== company.id)
                                )
                              }
                              className="h-4 w-4 accent-[#174B3D]"
                            />
                            <span className="font-semibold">{company.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-2 text-xs text-amber-800">
                    Default is private. Only selected companies will be able to see this contract and order from its reserved coffee.
                  </p>
                </div>
              )}

              {selectedCustomer && selectedCustomerCompanies.length === 0 && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs text-amber-800">
                  This customer is not assigned to a company, so the contract will remain visible only to the customer and admins.
                </p>
              )}
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
                  Bags
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
                {formData.VARIETY && (
                  <p className="text-xs text-gray-500 mt-1">
                    Bag size:{" "}
                    {toNum(
                      visibleSheetData.find(
                        (item) => `${item.Variety} (${item.Farm})` === formData.VARIETY
                      )?.bagKg,
                      DEFAULT_BAG_KG
                    )}{" "}
                    kg each
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  Unit Price (GBP/kg)
                </label>
                <input
                  type="number"
                  name="PRICE"
                  value={formData.PRICE}
                  onChange={handleChange}
                  disabled={!formData.VARIETY}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                  min={0}
                  step="0.01"
                />
                {selectedBasePrice > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Default price: {formatGBP(selectedBasePrice)}/kg
                  </p>
                )}
                {currentDiscountPerKg > 0 && (
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    Discount applied: {formatGBP(currentDiscountPerKg)}/kg off ({currentDiscountPercent.toFixed(1)}%)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  Subtotal for this selection (GBP)
                </label>
                <input
                  type="text"
                  value={
                    formData.AMOUNT && formData.PRICE
                      ? (
                          parseInt(formData.AMOUNT, 10) *
                          toNum(selectedCoffeeForPricing?.bagKg, DEFAULT_BAG_KG) *
                          currentUnitPrice
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

                    const finalPrice = toNum(formData.PRICE);
                    if (finalPrice <= 0) {
                      alert("Please enter a valid unit price.");
                      return;
                    }

                    const manualPrice =
                      selectedBasePrice > 0 && Math.abs(finalPrice - selectedBasePrice) > 0.005;
                    const clientKey = `${selectedCoffeeForPricing?.id || formData.VARIETY}-${Date.now()}`;
                    setGeneralDiscountSelection((prev) => ({
                      ...prev,
                      [clientKey]: !manualPrice,
                    }));

                    setCoffeeSelections((prev) => [
                      ...prev,
                      {
                        inventoryItemId:
                          visibleSheetData.find(
                            (item) => `${item.Variety} (${item.Farm})` === formData.VARIETY
                          )?.id || null,
                        variety: formData.VARIETY,
                        amount: parseInt(formData.AMOUNT, 10),
                        price: finalPrice,
                        basePrice: selectedBasePrice || finalPrice,
                        clientKey,
                        priceSource: manualPrice ? "manual" : "default",
                        discountPercent:
                          selectedBasePrice > finalPrice
                            ? ((selectedBasePrice - finalPrice) / selectedBasePrice) * 100
                            : 0,
                        bagKg: toNum(
                          visibleSheetData.find(
                            (item) => `${item.Variety} (${item.Farm})` === formData.VARIETY
                          )?.bagKg,
                          DEFAULT_BAG_KG
                        ),
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
                {coffeeSelections.length > 0 && (
                  <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-900 mb-1">
                          General discount (%)
                        </label>
                        <input
                          type="number"
                          value={generalDiscountPercent}
                          onChange={(e) => setGeneralDiscountPercent(e.target.value)}
                          className="w-full border border-emerald-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900"
                          min={0}
                          max={99}
                          step="0.1"
                          placeholder="Example: 5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyGeneralDiscountToSelected}
                        disabled={selectedGeneralDiscountCount === 0}
                        className="h-10 px-4 rounded-lg bg-[#044421] text-white text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Apply discount
                      </button>
                      <button
                        type="button"
                        onClick={clearGeneralDiscountFromSelected}
                        disabled={selectedGeneralDiscountCount === 0}
                        className="h-10 px-4 rounded-lg border border-emerald-200 bg-white text-emerald-900 text-sm font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Reset selected
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-emerald-900/75">
                      {selectedGeneralDiscountCount} coffee{selectedGeneralDiscountCount === 1 ? "" : "s"} selected. Manual prices are skipped automatically.
                    </p>
                  </div>
                )}

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
                          {item.amount} bags x {selectionBagKg(item)} kg x {formatGBP(item.price)}/kg = {formatGBP(item.amount * selectionBagKg(item) * item.price)}
                        </div>
                        {toNum(item.basePrice, item.price) > item.price && (
                          <div className="text-emerald-700 text-xs font-semibold mt-1">
                            Discount: {formatGBP(toNum(item.basePrice, item.price) - item.price)}/kg off the default {formatGBP(toNum(item.basePrice, item.price))}/kg
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <label
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                              canUseGeneralDiscount(item)
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800 cursor-pointer"
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(generalDiscountSelection[selectionKeyFor(item, idx)])}
                              disabled={!canUseGeneralDiscount(item)}
                              onChange={(e) =>
                                setGeneralDiscountSelection((prev) => ({
                                  ...prev,
                                  [selectionKeyFor(item, idx)]: e.target.checked,
                                }))
                              }
                              className="h-3.5 w-3.5 accent-[#044421]"
                            />
                            General discount
                          </label>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {item.priceSource === "manual"
                              ? "Manual price"
                              : item.priceSource === "general"
                              ? `${toNum(item.discountPercent).toFixed(1)}% general discount`
                              : "Default price"}
                          </span>
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
                      Estimated Total Price (GBP)
                    </label>
                    <input
                      type="text"
                      value={coffeeSelections
                        .reduce(
                          (acc, item) =>
                            acc + item.amount * selectionBagKg(item) * item.price,
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
                        (acc, item) => acc + item.amount * selectionBagKg(item),
                        0
                      )} kg`}
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700"
                    />
                  </div>
                </div>
              </div>


              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <h4 className="font-semibold mb-3 text-gray-800">Credit</h4>

                <div className="flex gap-4 mb-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="radio"
                      name="credit"
                      checked={hasCredit === true}
                      onChange={() => setHasCredit(true)}
                      className="accent-blue-600"
                    />
                    <span>Yes</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="radio"
                      name="credit"
                      checked={hasCredit === false}
                      onChange={() => {
                        setHasCredit(false);
                        setCreditAmount("0"); // 👈 importante
                      }}
                      className="accent-blue-600"
                    />
                    <span>No</span>
                  </label>
                </div>

                {hasCredit && (
                  <div>
                    <label className="block font-medium mb-1 text-sm">
                      Credit Amount (£)
                    </label>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min={0}
                    />
                  </div>
                )}

                {!hasCredit && (
                  <p className="text-sm text-gray-500">
                    Credit amount will be £0
                  </p>
                )}
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
                <select
                  value={startDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    calculateReservationPeriod(v, endDate);
                  }}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Select start month</option>
                  {monthOptions.map((option) => (
                    <option key={`start-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">
                  End Month
                </label>
                <select
                  value={endDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEndDate(v);
                    calculateReservationPeriod(startDate, v);
                  }}
                  className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="">Select end month</option>
                  {monthOptions.map((option) => (
                    <option key={`end-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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


