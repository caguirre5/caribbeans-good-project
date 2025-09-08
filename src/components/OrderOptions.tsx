import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
// añade este import (ajusta la ruta a tu proyecto)
import { useAuth } from '../contexts/AuthContext';


interface SheetData {
  Farm: string;
  Variety: string;
  Process: string;
  'Our Tasting Notes': string;
  '30 KG Sacks': string;
  Price: string;
  '12 bags Bundle + 1 Free': string;
}

interface CoffeeSelection {
  variety: string;
  amount: number;
  price: number;
}

interface DonationsData {
  donations: number;
  kilograms: number;
}

const DELIVERY_COSTS = {
  economy: 75,
  express: 95,
  saturday: 100,
};

type OrderItem = {
  varietyName: string;
  bags: number;
  unitPricePerKg: number;
};

type CreateOrderBody = {
  customerName: string | null;
  customerEmail: string | null;
  items: OrderItem[];
  deliveryMethod: 'economy' | 'express' | 'saturday';
  preferredDeliveryDate: string | null; // ISO string
  address?: string | null;
  notes?: string | null;
};


const PlaceOrderForm: React.FC = () => {
  const { currentUser } = useAuth();
  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [selectedVariety, setSelectedVariety] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);

  const [coffeeSelections, setCoffeeSelections] = useState<CoffeeSelection[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryType, setDeliveryType] = useState<'economy' | 'express' | 'saturday'>('economy');

  // const approvedPostcode = true; // Simulación por ahora

  const [hunchouenData, setHunchouenData] = useState<DonationsData>({ donations: 0, kilograms: 0 });

  const DONATION_BAG_KG = 24

  const isAtLeast3DaysFromToday = (dateStr: string) => {
    if (!dateStr) return false;
    const chosen = new Date(dateStr);
    if (isNaN(chosen.getTime())) return false;
    const now = new Date();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return chosen.getTime() >= now.getTime() + threeDaysMs;
  };  

  useEffect(() => {
    const SHEET_ID = '1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE';
    const API_KEY = 'AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k';
    const RANGE = 'Sheet1!A:G';

    const fetchSheetData = async () => {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const rows = data.values;

        const formatted = rows.slice(1).map((row: string[]) => ({
          Farm: row[0],
          Variety: row[1],
          Process: row[2],
          'Our Tasting Notes': row[3],
          '30 KG Sacks': row[4],
          Price: row[5],
          '12 bags Bundle + 1 Free': row[6],
        }));

        const fetchHunchouenData = async () => {
          try {
            const db = getFirestore();
            const hunchRef = doc(db, "projects", "hunchouen");
            const hunchSnap = await getDoc(hunchRef);
            if (hunchSnap.exists()) {
              const data = hunchSnap.data();
              setHunchouenData({
                donations: Number(data.donations) || 0,
                kilograms: Number(data.kilograms) || 0,
              });
            }
          } catch (err) {
            console.error("Error fetching hunchouen data:", err);
          }
        };

        setSheetData(formatted);
        fetchHunchouenData();
      } catch (error) {
        console.error('Error fetching sheet data:', error);
      }
    };

    fetchSheetData();
  }, []);

  const handleVarietySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedVariety(value);

    const selected = sheetData.find(item => `${item.Variety} (${item.Farm})` === value);
    if (selected) {
      const parsedPrice = parseFloat(selected.Price.replace('£', '').trim());
      const parsedStock = parseInt(selected['30 KG Sacks']);
      setPrice(parsedPrice);
      setStockAvailable(parsedStock);
    }
  };

  const handleAddItem = () => {
    if (!selectedVariety || amount <= 0 || price <= 0) return;
    if (coffeeSelections.some(item => item.variety === selectedVariety)) {
      alert("This variety has already been added.");
      return;
    }

    setCoffeeSelections(prev => [...prev, { variety: selectedVariety, amount, price }]);
    setSelectedVariety('');
    setAmount(0);
    setPrice(0);
    setStockAvailable(null);
  };

  const buildOrderEmailHTML = (
    customerName: string | null,
    customerEmail: string | null,
    selections: CoffeeSelection[],
    deliveryDateISO: string,
    deliveryMethod: 'economy' | 'express' | 'saturday'
  ) => {
    const BAG_KG = 24;
    const subtotal = selections.reduce((acc, it) => acc + it.amount * BAG_KG * it.price, 0);
    const totalBags = selections.reduce((acc, it) => acc + it.amount, 0);
    const DELIVERY_COSTS = { economy: 75, express: 95, saturday: 100 } as const;
    const deliveryFee = subtotal >= 300 || totalBags >= 15 ? 0 : DELIVERY_COSTS[deliveryMethod];
    const total = subtotal + deliveryFee;
  
    const itemsRows = selections.map(it => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #eee;">${it.variety}</td>
        <td style="padding:6px 8px;border:1px solid #eee;text-align:right;">${it.amount}</td>
        <td style="padding:6px 8px;border:1px solid #eee;text-align:right;">£${it.price.toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #eee;text-align:right;">£${(it.amount * BAG_KG * it.price).toFixed(2)}</td>
      </tr>
    `).join('');
  
    const dateTxt = new Date(deliveryDateISO).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height:1.6; color:#111;">
          <h2 style="margin:0 0 8px;">Thanks for your order! ☕</h2>
          <p style="margin:0 0 16px;">
            Hi ${customerName || 'there'}, we’ve received your order and it has been successfully created.
          </p>

          <p style="margin:0 0 16px;">
            <b>Status:</b> Your order is currently <span style="color:#d97706;font-weight:bold;">pending approval</span>.
            Once our team reviews and dispatches it, you’ll receive a confirmation email.
          </p>

          <p style="margin:0 0 16px;">
            In the meantime, you can track your order status and view full details anytime by logging into the portal.
            Once inside, open the menu at the top-right corner of the website and select <b>“My Orders”</b>.
          </p>

          <p style="margin:0 0 8px;"><b>Customer:</b> ${customerName || '(No name)'} — ${customerEmail || ''}</p>
          <p style="margin:0 0 16px;"><b>Preferred delivery:</b> ${dateTxt} · <b>Method:</b> ${deliveryMethod}</p>

          <table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; margin:12px 0;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Variety</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:right;">Bags</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:right;">£/kg</th>
                <th style="padding:6px 8px;border:1px solid #eee;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || `<tr><td colspan="4" style="padding:8px;border:1px solid #eee;">No items</td></tr>`}
            </tbody>
          </table>

          <p style="margin:6px 0;"><b>Items subtotal:</b> £${subtotal.toFixed(2)}</p>
          <p style="margin:6px 0;"><b>Delivery fee:</b> £${deliveryFee.toFixed(2)}</p>
          <p style="margin:6px 0;font-size:16px;"><b>Total:</b> £${total.toFixed(2)}</p>

          <p style="margin-top:18px;">
            Thanks again for choosing <b>Caribbean Goods</b>. If you have any questions, just reply to this email.
          </p>
          <p>— The Caribbean Goods Team</p>
        </body>
      </html>
      `;

  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (coffeeSelections.length === 0) {
      alert('Please add at least one coffee variety.');
      return;
    }
  
    if (!isAtLeast3DaysFromToday(deliveryDate)) {
      alert('Delivery date must be at least 3 days from today.');
      return;
    }
  
    try {
      const items: OrderItem[] = coffeeSelections.map((item) => ({
        varietyName: item.variety,      // p.ej. "Geisha (Finca La Paz)"
        bags: item.amount,
        unitPricePerKg: item.price,     // £/kg
      }));
  
      const body: CreateOrderBody = {
        customerName: currentUser?.displayName ?? null,
        customerEmail: currentUser?.email ?? null,
        items,
        deliveryMethod: deliveryType,
        // envía ISO; el backend ya convierte a Date()
        preferredDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        address: null,
        notes: null,
      };
  
      const token = await currentUser?.getIdToken();
      const resp = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/orders/orders/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
  
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to create order');
      }
  
      const data = await resp.json();
      console.log('✅ Order created:', data);


      // Enviar email de confirmación usando la NUEVA ruta /email/sendCustomEmail
      try {
        const token2 = await currentUser?.getIdToken();
        const subject = "Your order has been received – pending approval ✅";
        const html = buildOrderEmailHTML(
          currentUser?.displayName ?? null,
          currentUser?.email ?? null,
          coffeeSelections,
          new Date(deliveryDate).toISOString(),
          deliveryType
        );

        const emailRes = await fetch(
          `${import.meta.env.VITE_FULL_ENDPOINT}/email/sendCustomEmail`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token2 ? { Authorization: `Bearer ${token2}` } : {}),
            },
            body: JSON.stringify({
              recipientEmail: currentUser?.email,
              subject,
              html,
            }),
          }
        );

        if (!emailRes.ok) {
          const t = await emailRes.text().catch(() => '');
          console.error('Email send failed:', t);
        } else {
          console.log('📧 Email sent');
        }
      } catch (e) {
        console.error('Email send error:', e);
      }


      // 2b) Notificar al admin (texto simple, sin HTML)
      try {
        const adminEmail = "caguirre.dt@gmail.com"; // cambia si usas otro

        // arma un resumen básico de ítems (máx. 5 líneas)
        const lines = body.items
          .slice(0, 5)
          .map(
            (it) => `• ${it.bags} bags — ${it.varietyName} @ £${it.unitPricePerKg}/kg`
          )
          .join("\n");

        const message =
          `A new order has been created and is pending approval.\n\n` +
          `Order ID: ${data?.orderId || "(unknown)"}\n` +
          `Customer: ${body.customerName || "(No name)"} — ${body.customerEmail || ""}\n` +
          `Preferred delivery: ${body.preferredDeliveryDate || "Not specified"}\n` +
          `Method: ${body.deliveryMethod}\n\n` +
          `Items:\n${lines}${body.items.length > 5 ? `\n(+${body.items.length - 5} more)` : ""}\n\n` +
          `Please review and approve in the admin dashboard.`;

        await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendEmailMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }, // esta ruta no requiere token
          body: JSON.stringify({
            recipientEmail: adminEmail,
            subject: "New order pending approval",
            message,
          }),
        });
      } catch (e) {
        console.error("Admin simple email failed:", e);
      }


  
      // Limpia el formulario si quieres
      setCoffeeSelections([]);
      setSelectedVariety('');
      setAmount(0);
      setPrice(0);
      setStockAvailable(null);
      setDeliveryDate('');
      setDeliveryType('economy');
  
      alert('Order created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit order.');
    }
  };
  

  // helper: detectar si un label "Variety (Farm)" es Hunchouen
  const isHunchouen = (label: string) => label.toLowerCase().includes("hunchouen");

  // Totales del carrito para Hunchouen (solo ítems agregados)
  const cartHunchBags = coffeeSelections
    .filter(i => isHunchouen(i.variety))
    .reduce((acc, i) => acc + i.amount, 0);

  const cartHunchKg = cartHunchBags * DONATION_BAG_KG;
  const cartDonation = cartHunchKg * hunchouenData.donations;

  // ❌ Elimina estas líneas de “preview”:
  // const previewHunchKg = isHunchouen(selectedVariety) ? amount * DONATION_BAG_KG : 0;
  // const previewDonation = previewHunchouenKg * hunchouenData.donations;
  // const totalHunchKgToShow = cartHunchKg + previewHunchKg;
  // const totalDonationToShow = cartDonation + previewDonation;

  // ✅ En su lugar usa solo carrito:
  const totalHunchKgToShow = cartHunchKg;
  const totalDonationToShow = cartDonation;


  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h2 className="text-xl font-bold">Place Your Coffee Order</h2>

      {/* Badge/Medalla flotante */}
      {(totalDonationToShow > 0) && (
        <div
          className="absolute right-4 -top-6 md:top-4 md:right-4
                    bg-yellow-50 border-2 border-yellow-400 text-yellow-900
                    rounded-xl shadow-lg px-4 py-3 flex items-start gap-3"
          aria-live="polite"
        >
          <span className="text-2xl">🌱</span>
          <div className="text-left text-sm md:text-base">
            <p className="font-bold">You’re supporting MAIA</p>
            <p>
              Hunchouen items:&nbsp;
              <span className="font-semibold">{totalHunchKgToShow}</span> kg
            </p>
            <p>
              Estimated donation:&nbsp;
              <span className="font-extrabold">£{totalDonationToShow.toFixed(2)}</span>
              &nbsp;(
              <span>£{hunchouenData.donations.toFixed(2)}</span>/kg)
            </p>
          </div>
        </div>
      )}


      {/* Select variety */}
      <div>
        <label className="block font-medium mb-1">Select Coffee</label>
        <select
          value={selectedVariety}
          onChange={handleVarietySelect}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">-- Select a coffee --</option>
          {sheetData.map((item, i) => (
            <option key={i} value={`${item.Variety} (${item.Farm})`}>
              {item.Variety} ({item.Farm})
            </option>
          ))}
        </select>
      </div>

      {/* Bags and price */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block font-medium mb-1">Bags (24kg each)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (stockAvailable !== null && val > stockAvailable) {
                alert(`Only ${stockAvailable} bags available.`);
                return;
              }
              setAmount(val);
            }}
            className="w-full border px-3 py-2 rounded"
          />
          {stockAvailable !== null && (
            <p className="text-xs text-gray-500 mt-1">
              Available: {stockAvailable} bags
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium mb-1">Unit Price (£/kg)</label>
          <input
            type="number"
            value={price}
            readOnly
            className="w-full border bg-gray-100 px-3 py-2 rounded text-gray-700"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          >
            Add Coffee
          </button>
        </div>
      </div>

      {/* Selected items */}
      <div>
        <h4 className="font-semibold mb-2">Selected Coffees</h4>
        {coffeeSelections.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No items yet.</p>
        ) : (
          <ul className="space-y-2">
            {coffeeSelections.map((item, idx) => (
              <li key={idx} className="bg-gray-50 px-4 py-2 border rounded relative text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setCoffeeSelections(prev => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1 right-2 text-gray-500 hover:text-red-600 text-sm font-bold"
                >
                  ×
                </button>
                <div className="font-semibold">{item.variety}</div>
                <div className="text-gray-700 text-sm mt-1">
                  {item.amount} bags × £{item.price} = £{(item.amount * 30 * item.price).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delivery section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Preferred Delivery Date</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 3 days from today</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Delivery Method</label>
          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as any)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="economy">Economy (£75)</option>
            <option value="express">Express (+£20)</option>
            <option value="saturday">Saturday (+£25)</option>
          </select>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-100 p-4 rounded space-y-1 text-sm">
        <p><strong>Total bags:</strong> {coffeeSelections.reduce((acc, item) => acc + item.amount, 0)}</p>
        <p><strong>Subtotal:</strong> £{coffeeSelections.reduce((acc, item) => acc + item.amount * 30 * item.price, 0).toFixed(2)}</p>
        <p><strong>Delivery fee:</strong> £{
          (coffeeSelections.reduce((acc, item) => acc + item.amount * 30 * item.price, 0) >= 300 ||
            coffeeSelections.reduce((acc, item) => acc + item.amount, 0) >= 15)
            ? '0 (Free)'
            : DELIVERY_COSTS[deliveryType]
        }</p>
        <p className="text-lg font-bold">Total: £{(
          coffeeSelections.reduce((acc, item) => acc + item.amount * 30 * item.price, 0) +
          (coffeeSelections.reduce((acc, item) => acc + item.amount * 30 * item.price, 0) >= 300 ||
            coffeeSelections.reduce((acc, item) => acc + item.amount, 0) >= 15
            ? 0
            : DELIVERY_COSTS[deliveryType])
        ).toFixed(2)}</p>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mt-4"
      >
        Submit Order
      </button>
    </form>
  );
};

export default PlaceOrderForm;
