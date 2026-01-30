import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface SheetData {
  Farm: string;
  Variety: string;
  Process: string;
  "Our Tasting Notes": string;
  "30 KG Sacks": string;
  Price: string;
  "12 bags Bundle + 1 Free": string;
}

interface SampleSelection {
  variety: string; 
  bags: number;    // número de muestras que pide (puedes interpretarlo como bolsas pequeñas)
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";
type SampleFormType = "Green" | "Roasted";

const SampleForm: React.FC = () => {
  const { currentUser } = useAuth();

  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [selectedVariety, setSelectedVariety] = useState("");
  const [amount, setAmount] = useState<number>(1);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);

  const [selections, setSelections] = useState<SampleSelection[]>([]);

  // Datos del cliente (básicos)
  const [name, setName] = useState<string>(currentUser?.displayName || "");
  const [email, setEmail] = useState<string>(currentUser?.email || "");
  const [phone, setPhone] = useState<string>("");

  // Dirección de envío
  const [addrLine1, setAddrLine1] = useState<string>("");
  const [addrLine2, setAddrLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [region, setRegion] = useState<string>("England & Wales");
  const [postcode, setPostcode] = useState<string>("");
  const [country, setCountry] = useState<string>("United Kingdom");
  const [notes, setNotes] = useState<string>("");

  // Estado de envío
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const [sampleType, setSampleType] = useState<SampleFormType>("Green");

  const MAX_SAMPLE_BAGS = 6;

  // =============================
  // 1) Cargar variedades del Sheet
  // =============================
  useEffect(() => {
    const SHEET_ID = "1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE";
    const API_KEY = "AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k";
    const RANGE = "Sheet1!A:G";

    const fetchSheetData = async () => {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const rows: string[][] = data.values || [];

        if (!rows.length) {
          setSheetData([]);
          return;
        }

        const formatted: SheetData[] = rows.slice(1).map((row) => ({
          Farm: row[0] || "",
          Variety: row[1] || "",
          Process: row[2] || "",
          "Our Tasting Notes": row[3] || "",
          "30 KG Sacks": row[4] || "",
          Price: row[5] || "",
          "12 bags Bundle + 1 Free": row[6] || "",
        }));

        setSheetData(formatted);
      } catch (error) {
        console.error("Error fetching sheet data for samples:", error);
      }
    };

    setEmail(currentUser?.email || "")
    fetchSheetData();
    
  }, []);

  // Solo variedades con stock y no SOLD OUT
  const inStockVarieties = sheetData.filter((item) => {
    const rawStock = String(item["30 KG Sacks"] ?? "").trim().toUpperCase();
    if (!rawStock) return false;
    if (rawStock.includes("SOLD OUT")) return false;

    const n = parseInt(rawStock, 10);
    return Number.isFinite(n) && n > 0;
  });

  // =============================
  // 2) Manejo de selección de variety
  // =============================
  const handleVarietySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedVariety(value);
    setAmount(1);

    const selected = inStockVarieties.find(
      (item) => `${item.Variety} (${item.Farm})` === value
    );

    if (selected) {
      const rawStock = String(selected["30 KG Sacks"] ?? "").trim().toUpperCase();
      const n = parseInt(rawStock, 10);
      setStockAvailable(Number.isFinite(n) ? n : null);
    } else {
      setStockAvailable(null);
    }
  };

  const handleAddSample = () => {
    if (!selectedVariety) return;
    if (amount <= 0) return;

    const totalBags = selections.reduce((sum, s) => sum + s.bags, 0);
    const newTotal = totalBags + amount;
  
    if (newTotal > MAX_SAMPLE_BAGS) {
      alert(
        `You can request up to ${MAX_SAMPLE_BAGS} sample bags. Your current total is ${totalBags}.`
      );
      return;
    }

    // Evita duplicados de la misma variety
    if (selections.some((s) => s.variety === selectedVariety)) {
      alert("You have already added this variety to the sample request.");
      return;
    }

    if (stockAvailable !== null && amount > stockAvailable) {
      alert(`Only ${stockAvailable} bags available for this variety.`);
      return;
    }

    setSelections((prev) => [...prev, { variety: selectedVariety, bags: amount }]);
    setSelectedVariety("");
    setAmount(1);
    setStockAvailable(null);
  };

  const handleRemoveSelection = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
  };

  // =============================
  // 3) Construir HTML de correos
  // =============================
  const buildAdminEmailHTML = () => {
    const itemsRows = selections
      .map(
        (it) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #eee;">${it.variety}</td>
        <td style="padding:6px 8px;border:1px solid #eee;text-align:right;">${it.bags}</td>
      </tr>
    `
      )
      .join("");

    const addressHtml = `
      ${addrLine1 || ""}${addrLine2 ? ", " + addrLine2 : ""}<br/>
      ${city || ""}${city && region ? ", " : ""}${region || ""}<br/>
      ${postcode || ""}${postcode && country ? ", " : ""}${country || ""}
    `;

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height:1.6; color:#111;">
          <h2 style="margin:0 0 10px;">New sample request</h2>
          <p>A customer has requested coffee samples. Here are the details:</p>

          <h3 style="margin:16px 0 8px;">Customer</h3>
          <p style="margin:0 0 4px;">
            <b>Name:</b> ${name || "(No name)"}
          </p>
          <p style="margin:0 0 4px;">
            <b>Email:</b> ${email || ""}
          </p>
          <p style="margin:0 0 4px;">
            <b>Phone:</b> ${phone || "(not provided)"}
          </p>

          <h3 style="margin:16px 0 8px;">Shipping address</h3>
          <p style="margin:0 0 8px;">${addressHtml}</p>

          ${
            notes.trim()
              ? `<p style="margin:0 0 16px;"><b>Notes:</b> ${notes.trim()}</p>`
              : ""
          }

          <h3 style="margin:16px 0 8px;">Sample type</h3>
          <p style="margin:0 0 8px;">
            <b>Requested as:</b> ${sampleType}
          </p>


          <h3 style="margin:16px 0 8px;">Samples requested</h3>
          <table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; margin:12px 0;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Variety</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:right;">Sample bags</th>
              </tr>
            </thead>
            <tbody>
              ${
                itemsRows ||
                `<tr><td colspan="2" style="padding:6px 8px;border:1px solid #eee;">No items</td></tr>`
              }
            </tbody>
          </table>

          <p style="margin-top:16px;">
            Please review this request and coordinate the shipment of the samples.
          </p>

          <p style="margin-top:24px;">— Sample requests, Caribbean Goods portal</p>
        </body>
      </html>
    `;
  };

  const buildCustomerEmailHTML = () => {
    const itemsRows = selections
      .map(
        (it) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #eee;">${it.variety}</td>
        <td style="padding:6px 8px;border:1px solid #eee;text-align:right;">${it.bags}</td>
      </tr>
    `
      )
      .join("");

    const addressHtml = `
      ${addrLine1 || ""}${addrLine2 ? ", " + addrLine2 : ""}<br/>
      ${city || ""}${city && region ? ", " : ""}${region || ""}<br/>
      ${postcode || ""}${postcode && country ? ", " : ""}${country || ""}
    `;

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height:1.6; color:#111;">
          <h2 style="margin:0 0 10px;">We’ve received your sample request ☕</h2>
          <p style="margin:0 0 16px;">
            Hi ${name || "there"}, thanks for requesting coffee samples from Caribbean Goods.
          </p>

          <p style="margin:0 0 12px;">
            Your request has been recorded and our team will prepare and ship your samples as soon as possible.
          </p>

          <h3 style="margin:16px 0 8px;">Shipping address</h3>
          <p style="margin:0 0 8px;">${addressHtml}</p>

          ${
            notes.trim()
              ? `<p style="margin:0 0 16px;"><b>Notes:</b> ${notes.trim()}</p>`
              : ""
          }

          <h3 style="margin:16px 0 8px;">Sample type</h3>
          <p style="margin:0 0 8px;">
            <b>Requested as:</b> ${sampleType}
          </p>

          <h3 style="margin:16px 0 8px;">Samples you requested</h3>
          <table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; margin:12px 0;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Variety</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:right;">Sample bags</th>
              </tr>
            </thead>
            <tbody>
              ${
                itemsRows ||
                `<tr><td colspan="2" style="padding:6px 8px;border:1px solid #eee;">No items</td></tr>`
              }
            </tbody>
          </table>

          <p style="margin-top:18px;">
            If you need to adjust anything, just reply to this email and we’ll be happy to help.
          </p>

          <p style="margin-top:24px;">— Caribbean Goods Team</p>
        </body>
      </html>
    `;
  };

  // =============================
  // 4) Enviar correos
  // =============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (selections.length === 0) {
      alert("Please select at least one coffee variety for your samples.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      alert("We could not find your email. Please check your account.");
      return;
    }

    if (!addrLine1.trim() || !city.trim() || !postcode.trim()) {
      alert("Please complete Address line 1, City and Postcode.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const token = await currentUser?.getIdToken();

      const adminHtml = buildAdminEmailHTML();
      const customerHtml = buildCustomerEmailHTML();

      // 1) Email a admins
      const adminEmails = [
        "caguirre.dt@gmail.com",
        "info@caribbeangoods.co.uk",
        "touillonoceane@gmail.com",
      ];

      await Promise.all(
        adminEmails.map(async (adminEmail) => {
          const res = await fetch(
            `${import.meta.env.VITE_FULL_ENDPOINT}/email/sendCustomEmail`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                recipientEmail: adminEmail,
                subject: `New sample request from ${name || "customer"}`,
                html: adminHtml,
              }),
            }
          );

          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("Admin email send failed:", txt);
          }
        })
      );

      // 2) Email al cliente
      const customerRes = await fetch(
        `${import.meta.env.VITE_FULL_ENDPOINT}/email/sendCustomEmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            recipientEmail: email,
            subject: "We’ve received your sample request ✅",
            html: customerHtml,
          }),
        }
      );

      if (!customerRes.ok) {
        const txt = await customerRes.text().catch(() => "");
        console.error("Customer email send failed:", txt);
      }

      setStatus("success");
      

      // Limpiar selección (puedes dejar datos del cliente si quieres)
      setSelections([]);
      setSelectedVariety("");
      setAmount(1);
      setStockAvailable(null);
      setSampleType("Green");
      setNotes("");
    } catch (err: any) {
      console.error("Sample request error:", err);
      setStatus("error");
      setErrorMessage(err?.message || "Failed to send sample request.");
    }
  };

  // =============================
  // 5) Render
  // =============================
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h2 className="text-xl font-bold mb-2">Request Coffee Samples</h2>
      <p className="text-sm text-gray-600 mb-4">
        Choose the coffees you would like to receive as samples and tell us where to send them.
      </p>

      {/* Select coffee */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sample type */}
        <div>
          <label className="block font-medium mb-1">Sample type</label>
          <select
            value={sampleType}
            onChange={(e) => setSampleType(e.target.value as SampleFormType)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="Green">Green</option>
            <option value="Roasted">Roasted</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose whether you want green or roasted samples.
          </p>
        </div>


        <div>
          <label className="block font-medium mb-1">Select coffee</label>
          <select
            value={selectedVariety}
            onChange={handleVarietySelect}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Select a coffee with stock --</option>
            {inStockVarieties.map((item, i) => (
              <option key={i} value={`${item.Variety} (${item.Farm})`}>
                {item.Variety} ({item.Farm}) - {item.Process}
              </option>
            ))}
          </select>
        </div>

        {/* Amount and stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block font-medium mb-1">Sample bags</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => {
                const val = parseInt(e.target.value || "0", 10);
                if (stockAvailable !== null && val > stockAvailable) {
                  alert(`Only ${stockAvailable} bags available for this coffee.`);
                  return;
                }
                setAmount(val);
              }}
              className="w-full border px-3 py-2 rounded"
            />
            {stockAvailable !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Stock available: {stockAvailable} bags
              </p>
            )}
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={handleAddSample}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full md:w-auto"
            >
              Add to sample request
            </button>
          </div>
        </div>

        {/* Selected samples list */}
        <div>
          <h4 className="font-semibold mb-2">Samples selected</h4>
          {selections.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No samples selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {selections.map((item, idx) => (
                <li
                  key={idx}
                  className="bg-gray-50 px-4 py-2 border rounded relative text-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveSelection(idx)}
                    className="absolute top-1 right-2 text-gray-500 hover:text-red-600 text-sm font-bold"
                  >
                    ×
                  </button>
                  <div className="font-semibold">{item.variety}</div>
                  <div className="text-gray-700 text-sm mt-1">
                    {item.bags} sample bag{item.bags !== 1 ? "s" : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Customer basic details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              Samples confirmation will be sent to your account email.
            </p>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block font-medium mb-1">Contact phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 07123 456789"
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Address */}
        <div className="space-y-3">
          <h4 className="font-semibold">Shipping address</h4>
          <div>
            <label className="block font-medium mb-1">Address line 1</label>
            <input
              type="text"
              value={addrLine1}
              onChange={(e) => setAddrLine1(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Address line 2 (optional)</label>
            <input
              type="text"
              value={addrLine2}
              onChange={(e) => setAddrLine2(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="England & Wales">England & Wales</option>
                <option value="Scotland">Scotland</option>
                <option value="Northern Ireland">Northern Ireland</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border px-3 py-2 rounded"
            placeholder="Any preferences or extra details about your sample request?"
          />
        </div>

        {/* Submit + status */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`px-6 py-2 rounded text-white ${
              status === "submitting"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {status === "submitting" ? "Sending request…" : "Send sample request"}
          </button>

          {status === "success" && (
            <p className="mt-2 text-sm text-green-700">
              Your sample request has been sent. You’ll receive a confirmation email shortly.
            </p>
          )}

          {status === "error" && (
            <p className="mt-2 text-sm text-red-700">
              There was a problem sending your request: {errorMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SampleForm;
