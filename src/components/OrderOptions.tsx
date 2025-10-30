import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useState, useEffect, useRef } from 'react';
// añade este import (ajusta la ruta a tu proyecto)
import { useAuth } from '../contexts/AuthContext';
import {
  buildRulesFromSheetValues,
  calcDeliveryFeeByTariff,
  getTariffInfo,
  type DeliverySpeed,
  type ShippingMode,
  type RuleWithTariff,
} from "../components/utils/tariffRules";


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



type OrderItem = {
  varietyName: string;
  bags: number;
  unitPricePerKg: number;
};

type CreateOrderBody = {
  customerName: string | null;
  customerEmail: string | null;
  items: OrderItem[];
  deliveryMethod: 'pickup' | 'economy' | 'express' | 'saturday';
  preferredDeliveryDate: string | null; // ISO string
  address?: string | null;
  notes?: string | null;
};

type BuiltRules = { rules: RuleWithTariff[] };

type QuoteStatus = 'ok' | 'poa' | 'no_match' | 'need_postcode' | 'flat';

const BAG_KG = 24 as const;

function computeDeliveryQuote(params: {
  totalKg: number;
  mode: ShippingMode;
  speed: DeliverySpeed;
  postcode: string;
  rules: RuleWithTariff[];
}) {
  const { totalKg, mode, speed, postcode, rules } = params;

  // tarifas planas por defecto
  const FLAT_ECON = 85;
  const FLAT_EXPRESS = 85 + 25;
  const flatFee = (speed === 'economy') ? FLAT_ECON : FLAT_EXPRESS;

  // Pick up: válido sin postcode
  if (mode === 'pickup') {
    return {
      status: 'ok' as QuoteStatus,
      fee: 0,
      message: 'Pick up — no delivery fee.',
    };
  }

  // ≤ 300 kg: por defecto tarifa plana,
  // pero si el postcode calculado es MAYOR que el flat, usa el mayor.
  if (totalKg <= 300) {
    // base por velocidad (econ=85, express=110)
    let fee = flatFee;

    // Si hay postcode + reglas, intentamos calcular la tarifa real
    if (postcode.trim() && rules.length > 0) {
      // Importante: no pasamos fallback y freeOverKg=0 para obtener la tarifa real,
      // y sólo considerarla si es numérica y mayor al flat.
      const rawTariff = calcDeliveryFeeByTariff({
        totalKg,
        mode: 'delivery',
        speed,
        postcode,
        rules,
        freeOverKg: 0,   // nunca gratis por peso en este branch
        // sin fallback: si no hay match => 0
      });

      if (rawTariff > 0) {
        fee = Math.max(fee, rawTariff);
      }
    }

    return {
      status: 'flat' as QuoteStatus,
      fee,
      message:
        fee > flatFee
          ? `Area surcharge applies for your postcode (${speed}).`
          : `Flat delivery fee (${speed}).`,
    };
  }


  // > 300 kg: necesitamos postcode para usar tabla y aplicar subsidio
  if (!postcode.trim()) {
    return {
      status: 'need_postcode' as QuoteStatus,
      fee: flatFee, // sigue mostrando el flat mientras no haya postcode
      message: 'Enter your postcode to apply the pallet tariff and subsidy.',
    };
  }

  // Con postcode: intentamos match en tabla
  const rawTariff = calcDeliveryFeeByTariff({
    totalKg,
    mode: 'delivery',
    speed,
    postcode,
    rules,
    freeOverKg: 0, // importante: no “gratis total” aquí
    fallback: () => flatFee, // si no se puede calcular, usamos flat (pero no se habilita submit)
  });

  const info = (rules.length > 0)
    ? getTariffInfo({ totalKg, speed, postcode, rules })
    : { status: 'no_match' as const };

  // Si la zona es POA
  if ((info as any).status === 'poa') {
    return {
      status: 'poa' as QuoteStatus,
      fee: 0,
      message:
        'Delivery fee: POA (Price On Application). We’ll contact you to confirm the quote for your area.',
    };
  }

  // Sin match en la tabla
  if ((info as any).status === 'no_match') {
    return {
      status: 'no_match' as QuoteStatus,
      fee: flatFee, // se muestra algo por defecto, pero no habilita submit
      message:
        'We could not find your postcode in our tariff zones. Please check it or contact support.',
    };
  }

  // OK: aplicar subsidio de £85 (sin bajar de 0)
  const OVER300_SUBSIDY = 85;
  const fee = Math.max(0, rawTariff - OVER300_SUBSIDY);

  return {
    status: 'ok' as QuoteStatus,
    fee,
    message: 'Pallet tariff applied.',
  };
}

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toLocalYMD = (d: Date) => {
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
};

type PlaceOrderFormProps = {
  onClose?: () => void;
};

type PickupLocation = 'loom' | 'cg';

const PlaceOrderForm: React.FC<PlaceOrderFormProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [selectedVariety, setSelectedVariety] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);

  const [coffeeSelections, setCoffeeSelections] = useState<CoffeeSelection[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showStockPanel, setShowStockPanel] = useState(false);

  // dentro del componente
  const [shippingMode, setShippingMode] = useState<ShippingMode>('pickup');
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>('economy');
  
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [tariffRules, setTariffRules] = useState<BuiltRules>({ rules: [] });
  const [postcode, setPostcode] = useState("");

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Address estructurado (UK)
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity]   = useState('');
  const [addrRegion, setAddrRegion] =
    useState<'England & Wales' | 'Scotland'>('England & Wales');
  const addrCountry = 'United Kingdom';

  const [noteText, setNoteText] = useState('');
  const [pickupLocation, setPickupLocation] = useState<PickupLocation>('loom');

  const [hunchouenData, setHunchouenData] = useState<DonationsData>({ donations: 0, kilograms: 0 });

  const [dateError, setDateError] = useState<string>("");

  const DONATION_BAG_KG = 24;

  const minDateStr = toLocalYMD(addDays(new Date(), 3));
  const todayStr   = toLocalYMD(new Date());  

  const formRef = useRef<HTMLDivElement>(null);

  const isAtLeast3DaysFromToday = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr >= minDateStr;  // compara YYYY-MM-DD
  };
  

  const ConfirmSummary: React.FC = () => {
    const subtotal = coffeeSelections.reduce((acc, it) => acc + it.amount * 24 * it.price, 0);
    const totalBags = coffeeSelections.reduce((acc, it) => acc + it.amount, 0);
    const totalKg = totalBags * 24;
  
    const quote = computeDeliveryQuote({
      totalKg,
      mode: shippingMode,
      speed: deliverySpeed,
      postcode,
      rules: tariffRules.rules,
    });
  
    const total = subtotal + quote.fee;
  
    return (
      <>
        {/* Customer + Delivery */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">{currentUser?.displayName || '(No name)'}</p>
            <p className="text-gray-700">{currentUser?.email || ''}</p>
          </div>
          <div>
            <p className="text-gray-500">Delivery</p>
            <p className="font-medium capitalize">{shippingMode}</p>

            {shippingMode === 'delivery' ? (
              <>
                <p className="capitalize">{deliverySpeed}</p>
                {postcode && <p>Postcode: <span className="font-medium">{postcode}</span></p>}
                <p className="truncate"
                  title={`${addrLine1}${addrLine2 ? ', '+addrLine2 : ''}, ${addrCity}, ${addrRegion}, ${postcode}, ${addrCountry}`}>
                  Address: <span className="font-medium">
                    {addrLine1}{addrLine2 ? `, ${addrLine2}` : ''}, {addrCity}, {addrRegion}, {postcode}, {addrCountry}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p>
                  Location: <span className="font-medium">
                    {pickupLocation === 'loom' ? 'Loom Coffeehouse' : 'Caribbean Goods'}
                  </span>
                </p>
              </>
            )}
            {noteText.trim() && (
              <p>Notes: <span className="font-medium break-words">{noteText}</span></p>
            )}
            <p>Date: <span className="font-medium">{deliveryDate || '—'}</span></p>

          </div>
        </div>
  
        {/* Items */}
        <div>
          <p className="text-gray-500 mb-2">Items</p>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Variety</th>
                  <th className="text-right p-2">24kg Bags</th>
                  <th className="text-right p-2">£/kg</th>
                  <th className="text-right p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {coffeeSelections.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{it.variety}</td>
                    <td className="p-2 text-right">{it.amount}</td>
                    <td className="p-2 text-right">£{it.price.toFixed(2)}</td>
                    <td className="p-2 text-right">£{(it.amount * 24 * it.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
  
        {/* Totals */}
        <div className="bg-gray-50 rounded-md p-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-gray-500">Subtotal</p>
            <p className="font-semibold">£{subtotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Delivery fee</p>
            <p className="font-semibold">£{quote.fee.toFixed(2)}</p>
          </div>
          <div className="col-span-2 border-t pt-2">
            <p className="text-gray-500">Total</p>
            <p className="text-lg font-bold">£{total.toFixed(2)}</p>
          </div>
        </div>
      </>
    );
  };

  useEffect(() => {
    // Bloquea el scroll del contenedor principal cuando un sub-modal está abierto
    const el = formRef.current;
    if (!el) return;

    if (showStockPanel || showConfirm) {
      el.classList.add('overflow-hidden');
    } else {
      el.classList.remove('overflow-hidden');
    }

    return () => el.classList.remove('overflow-hidden');
  }, [showStockPanel, showConfirm]);
  
  useEffect(() => {
    const SHEET_ID_TARIFF = "1BZljN3v4Skt9ANzL6M4MyBhm8X80Qe9kgU8_Hh0wU9E";
    const API_KEY = "AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k";
    const RANGE = "Sheet1!A:F"; // A:F = 6 columnas: Zone | Postcode | Eco Half | Eco Full | ND Half | ND Full
  
    async function fetchTariffs() {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID_TARIFF}/values/${RANGE}?key=${API_KEY}`;
        console.log("[TARIFF] fetching:", url);
        const resp = await fetch(url);
        const json = await resp.json();
  
        console.log("[TARIFF] json.keys:", Object.keys(json));
        console.log("[TARIFF] json.range:", json.range);
        console.log("[TARIFF] values length:", json.values?.length);
        console.log("[TARIFF] header row:", json.values?.[0]);
        console.log("[TARIFF] sample row:", json.values?.[1]);
  
        const values: string[][] = json.values || [];
        const { rules } = buildRulesFromSheetValues(values);
  
        console.log("[TARIFF] built rules:", rules.length);
        // Muestra 3 reglas para inspección
        console.log("[TARIFF] sample rule 1:", rules[0]);
        console.log("[TARIFF] sample rule 2:", rules[1]);
        console.log("[TARIFF] sample rule 3:", rules[2]);
  
        setTariffRules({ rules });
      } catch (e) {
        console.error("[TARIFF] fetch error:", e);
      }
    }
  
    fetchTariffs();
  }, []);
  

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
    deliveryMethod: 'pickup' | 'economy' | 'express' | 'saturday' 
  ) => {
    const BAG_KG = 24;
    const subtotal = selections.reduce((acc, it) => acc + it.amount * BAG_KG * it.price, 0);
    const totalBags = selections.reduce((acc, it) => acc + it.amount, 0);
    const DELIVERY_COSTS = { economy: 75, express: 95, saturday: 100 } as const;
    const deliveryFee =
    deliveryMethod === 'pickup'
      ? 0
      : (subtotal >= 300 || totalBags >= 15 ? 0 : DELIVERY_COSTS[deliveryMethod]);
    const total = subtotal + deliveryFee;

    const methodLabel = deliveryMethod === 'pickup' ? 'pickup' : deliveryMethod;
  
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
          <p style="margin:0 0 16px;"><p><b>Preferred delivery:</b> ${dateTxt} · <b>Method:</b> ${methodLabel}</p>

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
  
  const openConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (coffeeSelections.length === 0) { alert('Please add at least one coffee variety.'); return; }
    if (!isAtLeast3DaysFromToday(deliveryDate)) { alert('Delivery date must be at least 3 days from today.'); return; }
    if (shippingMode === 'delivery') {
      if (!addrLine1.trim() || !addrCity.trim() || !postcode.trim()) {
        alert('Please complete Address line 1, City and Postcode.');
        return;
      }
    }    
    setSubmitStatus('idle');
    setSubmitError('');
    setShowConfirm(true);
  };  

  const submitOrder = async () => {
  
    try {
      setIsSubmitting(true);
      setSubmitError('');

      const items: OrderItem[] = coffeeSelections.map((item) => ({
        varietyName: item.variety,      // p.ej. "Geisha (Finca La Paz)"
        bags: item.amount,
        unitPricePerKg: item.price,     // £/kg
      }));

      const fullAddress =
        shippingMode === 'delivery'
          ? `${addrLine1}${addrLine2 ? ', ' + addrLine2 : ''}, ${addrCity}, ${addrRegion}, ${postcode}, ${addrCountry}`
          : null;

      const pickupLabel = pickupLocation === 'loom' ? 'Loom Coffeehouse' : 'Caribbean Goods';
      const composedNotes =
        shippingMode === 'pickup'
          ? `Pickup location: ${pickupLabel}${noteText.trim() ? `. Notes: ${noteText.trim()}` : ''}`
          : (noteText.trim() || null);
      
  
      const body: CreateOrderBody = {
        customerName: currentUser?.displayName ?? null,
        customerEmail: currentUser?.email ?? null,
        items,
        deliveryMethod: shippingMode === 'pickup' ? 'pickup' : deliverySpeed,
        // envía ISO; el backend ya convierte a Date()
        preferredDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        address: fullAddress,
        notes: composedNotes,
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
          shippingMode === 'pickup' ? 'pickup' : deliverySpeed
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
        const adminEmails = [
          "caguirre.dt@gmail.com",
          "info@caribbeangoods.co.uk",
        ];
      
        // Arma un resumen básico de ítems (máx. 5 líneas)
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
      
        // Enviar el correo a todos los admins en paralelo
        await Promise.all(
          adminEmails.map(async (email) => {
            try {
              await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/email/sendEmailMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipientEmail: email,
                  subject: "New order pending approval",
                  message,
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
      
  
      // Limpia el formulario si quieres
      setCoffeeSelections([]);
      setSelectedVariety('');
      setAmount(0);
      setPrice(0);
      setStockAvailable(null);
      setDeliveryDate('');
      setPostcode('');
      setAddrLine1(''); setAddrLine2(''); setAddrCity('');
      setAddrRegion('England & Wales');
      setNoteText('');
      setPickupLocation('loom');


      setSubmitStatus('success');

      setCreatedOrderId(null);

    } catch (err:any) {
      console.error(err);
      setSubmitStatus('error');   // 👈 muestra pantalla de error dentro del modal
      setSubmitError(err?.message || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // "YYYY-MM-DD"
    setDeliveryDate(value);
    setDateError("");
  
    // Solo validamos reglas especiales si es DELIVERY
    if (shippingMode === 'delivery') {
      if (value && value < minDateStr) {
        setDateError("Please choose a date at least 3 days from today.");
        return;
      }
      if (value) {
        const dow = new Date(value).getDay(); // 0 = Sunday
        if (dow === 0) {
          setDateError("We don’t deliver on Sundays. Please choose another date.");
          return;
        }
      }
    }
  };
  
  
  const handleCloseAll = () => {
    setShowConfirm(false);  // cierra el modal de confirmación interno
    onClose?.();            // cierra el modal pequeño del padre
  };
  


  // helper: detectar si un label "Variety (Farm)" es Hunchouen
  const isHunchouen = (label: string) => label.toLowerCase().includes("hunchouen");

  // Totales del carrito para Hunchouen (solo ítems agregados)
  const cartHunchBags = coffeeSelections
    .filter(i => isHunchouen(i.variety))
    .reduce((acc, i) => acc + i.amount, 0);

  const cartHunchKg = cartHunchBags * DONATION_BAG_KG;
  const cartDonation = cartHunchKg * hunchouenData.donations;

  // ✅ En su lugar usa solo carrito:
  const totalHunchKgToShow = cartHunchKg;
  const totalDonationToShow = cartDonation;


  return (
    <div className="relative" ref={formRef}>
      <form onSubmit={openConfirm} className="max-w-3xl mx-auto bg-white p-6 rounded shadow space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">
            Place Your Coffee Order
          </h2>
          
          <button
            type="button"
            onClick={() => setShowStockPanel(!showStockPanel)}
            className="text-sm font-medium px-4 py-2 rounded-lg 
                      bg-[#044421] text-white shadow-sm
                      hover:bg-[#06603a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#044421]
                      transition-all duration-200"
          >
            {showStockPanel ? "Hide Stock" : "View Stock"}
          </button>


          {totalDonationToShow > 0 && (
            <div
              className="md:sticky md:top-4 shrink-0
                        bg-yellow-50 border-2 border-yellow-400 text-yellow-900
                        rounded-xl shadow px-4 py-3 flex items-start gap-3"
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
                  &nbsp;(<span>£{hunchouenData.donations.toFixed(2)}</span>/kg)
                </p>
              </div>
            </div>
          )}
        </div>


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
                    {item.amount} bags × £{item.price} = £{(item.amount * BAG_KG * item.price).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delivery section */}
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Fulfilment</label>

            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="shippingMode"
                  value="pickup"
                  checked={shippingMode === 'pickup'}
                  onChange={() => setShippingMode('pickup')}
                />
                <span>Pick up (FREE)</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="shippingMode"
                  value="delivery"
                  checked={shippingMode === 'delivery'}
                  onChange={() => setShippingMode('delivery')}
                />
                <span>Delivery</span>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Pick up is always available. If you choose Delivery, shipping may be free over 300&nbsp;kg, otherwise fees apply.
            </p>
          </div>

          {/* Fecha siempre visible (ajústalo si quieres que solo aplique en delivery) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferred Delivery Date (reemplaza tu bloque actual) */}
            <div>
              <label className="block font-medium mb-1">{shippingMode === 'delivery' ? 'Preferred Delivery Date' : 'Preferred Pickup Date'}</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={handleDateChange}
                // En Delivery: mínimo hoy+3; en Pickup: desde hoy
                min={shippingMode === 'delivery' ? minDateStr : todayStr}
                className={
                  "w-full border px-3 py-2 rounded " +
                  (dateError ? "border-red-400 focus:border-red-500" : "")
                }
              />
              {/* Disclaimer: solo en Delivery */}
              {shippingMode === 'delivery' ? (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 3 days from today. No deliveries on Sundays.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                </p>
              )}
              {dateError && <p className="text-xs text-red-600 mt-1">{dateError}</p>}
            </div>



            {/* Método de envío solo si es delivery */}
            {shippingMode === 'delivery' && (
              <div>
                <label className="block font-medium mb-1">Delivery Method</label>
                <select
                  value={deliverySpeed}
                  onChange={(e) => setDeliverySpeed(e.target.value as DeliverySpeed)}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="economy">Economy (£85)</option>
                  <option value="express">Express (+£20)</option>
                  <option value="saturday">Saturday (+£25)</option>
                </select>
              </div>
            )}
          </div>

          {shippingMode === 'pickup' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 md:p-5 text-emerald-900">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📍</span>
                <h4 className="text-base md:text-lg font-semibold">Pick up locations &amp; hours</h4>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Loom Coffeehouse */}
                <label
                  onClick={() => setPickupLocation('loom')}
                  className={`rounded-lg bg-white/70 border p-4 shadow-sm cursor-pointer transition ${
                    pickupLocation === 'loom'
                      ? 'border-emerald-400 ring-2 ring-emerald-200'
                      : 'border-emerald-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="pickupLocation"
                      className="mt-1"
                      checked={pickupLocation === 'loom'}
                      onChange={() => setPickupLocation('loom')}
                    />
                    <div>
                      <p className="font-semibold">Loom Coffeehouse</p>
                      <p className="mt-1 text-sm leading-relaxed">
                        128 Maryhill Road, Glasgow. G20 7QS
                      </p>
                      <div className="mt-3 text-sm">
                        <p>Tuesday – Friday <span className="text-gray-600">(8 am – 2 pm)</span></p>
                        <p>Saturday <span className="text-gray-600">(9 am – 3 pm)</span></p>
                        <p>Sunday <span className="text-gray-600">(10 am – 2 pm)</span></p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Caribbean Goods */}
                <label
                  onClick={() => setPickupLocation('cg')}
                  className={`rounded-lg bg-white/70 border p-4 shadow-sm cursor-pointer transition ${
                    pickupLocation === 'cg'
                      ? 'border-emerald-400 ring-2 ring-emerald-200'
                      : 'border-emerald-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="pickupLocation"
                      className="mt-1"
                      checked={pickupLocation === 'cg'}
                      onChange={() => setPickupLocation('cg')}
                    />
                    <div>
                      <p className="font-semibold">Caribbean Goods</p>
                      <p className="mt-1 text-sm leading-relaxed">
                        Safestore Self Storage Glasgow Central<br />
                        9 Canal St. G4 0AD
                      </p>
                      <div className="mt-3 text-sm">
                        <p>Mon–Saturday <span className="text-gray-600">(8 am – 6 pm)</span></p>
                        <p>Sunday <span className="text-gray-600">(10 am – 4 pm)</span></p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <p className="mt-4 text-xs text-emerald-800/80">
                Tip: Tell us which location you prefer in the notes, or we’ll follow up by email.
              </p>
            </div>
          )}


          {/* Address solo si es delivery */}
          {shippingMode === 'delivery' && (
            <div className="grid grid-cols-1 gap-4">
              {/* Address lines */}
              <div>
                <label className="block font-medium mb-1">Delivery Address</label>
                <input
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="Address line 1 (street and number)"
                  className="w-full border px-3 py-2 rounded mb-2"
                />
                <input
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  placeholder="Address line 2 (optional)"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              {/* City / Region / Country */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-1">City</label>
                  <input
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="e.g. Glasgow"
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Region</label>
                  <select
                    value={addrRegion}
                    onChange={(e) => setAddrRegion(e.target.value as any)}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="England & Wales">England & Wales</option>
                    <option value="Scotland">Scotland</option>
                    <option value="Northern Ireland">Northern Ireland</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Country</label>
                  <input
                    value={addrCountry}
                    disabled
                    className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-700"
                  />
                </div>
              </div>

              {/* 👇 Bajo esto deja tu bloque actual de Postcode SIN CAMBIOS */}
              <div> 
                <label className="block font-medium mb-1">Postcode</label> 
                <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. OX20, NE30, CA" className="w-full border px-3 py-2 rounded" /> 
              </div>
            </div>
          )}



        </div>

        <div>
          <label className="block font-medium mb-1">Notes (optional)</label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder={shippingMode === 'pickup'
              ? "Anything we should know for pickup?"
              : "Anything we should know for delivery?"}
            className="w-full border px-3 py-2 rounded"
          />
        </div>



        {/* Totals */}
        {(() => {
          const totalBags = coffeeSelections.reduce((acc, item) => acc + item.amount, 0);
          const totalKg = totalBags * BAG_KG;
          const subtotal = coffeeSelections.reduce((acc, item) => acc + item.amount * BAG_KG * item.price, 0);

          const quote = computeDeliveryQuote({
            totalKg,
            mode: shippingMode,
            speed: deliverySpeed,
            postcode,
            rules: tariffRules.rules,
          });

          const total = subtotal + quote.fee;

          // condiciones para habilitar el submit:
          // - pickup siempre ok
          // - delivery:
          //   * ≤300 kg -> flat -> ok
          //   * >300 kg -> solo ok si status === 'ok'
          const canSubmit =
            shippingMode === 'pickup' ||
            (shippingMode === 'delivery' && (
              totalKg <= 300 ? true : (quote.status === 'ok')
            ));

          return (
            <>
              {/* Mensajes UX claros */}
              {shippingMode === 'delivery' && (
                <div
                  className={
                    "rounded-lg border px-3 py-2 mb-3 text-sm " +
                    (quote.status === 'ok' || quote.status === 'flat'
                      ? "border-green-200 bg-green-50 text-green-800"
                      : quote.status === 'poa'
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-red-200 bg-red-50 text-red-800")
                  }
                >
                  {quote.status === 'poa' && (
                    <p>
                      <strong>POA (Price On Application):</strong> {quote.message}
                    </p>
                  )}
                  {quote.status === 'no_match' && (
                    <p>
                      <strong>Postcode not covered:</strong> {quote.message}
                    </p>
                  )}
                  {quote.status === 'need_postcode' && (
                    <p>
                      <strong>Postcode required:</strong> {quote.message}
                    </p>
                  )}
                  {(quote.status === 'ok' || quote.status === 'flat') && (
                    <p>{quote.message}</p>
                  )}
                </div>
              )}

              <div className="bg-gray-100 p-4 rounded space-y-1 text-sm">
                <p><strong>Total bags:</strong> {totalBags}</p>
                <p><strong>Total kg:</strong> {totalKg}</p>
                <p><strong>Subtotal:</strong> £{subtotal.toFixed(2)}</p>
                <p><strong>Delivery fee:</strong> £{quote.fee.toFixed(2)}</p>
                <p className="text-lg font-bold">Total: £{total.toFixed(2)}</p>
              </div>

              {/* Botón con estado deshabilitado si no se puede cotizar correctamente */}
              <button
                type="submit"
                disabled={
                  !canSubmit ||
                  coffeeSelections.length === 0 ||
                  (shippingMode === 'delivery' && !isAtLeast3DaysFromToday(deliveryDate)) ||
                  !!dateError
                }
                className={
                  "mt-4 px-6 py-2 rounded text-white " +
                  (
                    !canSubmit ||
                    coffeeSelections.length === 0 ||
                    (shippingMode === 'delivery' && !isAtLeast3DaysFromToday(deliveryDate)) ||
                    !!dateError
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  )
                }
              >
                Submit Order
              </button>

            </>
          );
        })()}




        {/* <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mt-4"
        >
          Submit Order
        </button> */}
      </form>

    {/* PANEL LATERAL */}
      {showStockPanel && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowStockPanel(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()} // evita cerrar al hacer click dentro
            role="dialog"
            aria-modal="true"
            aria-label="Available Coffees"
          >
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Available Coffees</h3>
              <button
                onClick={() => setShowStockPanel(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Farm</th>
                      <th className="border p-2 text-left">Variety</th>
                      {/* <th className="border p-2 text-left">Process</th> */}
                      <th className="border p-2 text-right">24kg bags</th>
                      <th className="border p-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetData.map((item, i) => {
                      const stockBags = parseInt(item['30 KG Sacks'] as unknown as string) || 0; // usamos tu columna
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border p-2">{item.Farm}</td>
                          <td className="border p-2">{item.Variety}</td>
                          {/* <td className="border p-2">{item.Process}</td> */}
                          <td className="border p-2 text-right">{stockBags}</td>
                          <td className="border p-2 text-right">{item.Price}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer / link a Prices & Availability */}
              <div className="mt-4 text-xs text-gray-600">
                For full details (process, tasting notes, etc.), click{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowStockPanel(false);           // cierra este modal
                    window.dispatchEvent(new Event('openCoffeeCharts')); // navega a Prices
                  }}
                  className="underline text-emerald-700 hover:text-emerald-800"
                >
                  Prices & Availability
                </button>.
              </div>


              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowStockPanel(false)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {submitStatus === 'success' ? 'Order placed 🎉' : submitStatus === 'error' ? 'There was a problem' : 'Confirm your order'}
              </h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-4 text-sm">
              {submitStatus === 'idle' && <ConfirmSummary />}

              {submitStatus === 'success' && (
                <div className="text-center space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-lg font-semibold text-green-700">Your order was placed successfully!</p>
                  <p className="text-gray-600">
                    {createdOrderId ? <>Order ID: <span className="font-mono">{createdOrderId}</span></> : null}
                  </p>
                  <p className="text-gray-600">
                    You’ll receive an email shortly. You can also review it under <b>My Orders</b>.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <p className="text-lg font-semibold text-red-700 text-center">We couldn’t place your order</p>
                  <p className="text-gray-700 text-center whitespace-pre-wrap">{submitError}</p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t flex items-center justify-end gap-3">
              {submitStatus === 'idle' && (
                <div>
                  {/* {shippingMode === 'pickup' && (
                    <div className="mt-2 mb-4">
                      <PickupInfo />
                    </div>
                  )} */}
                  <div className='flex justify-end'>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 mr-2 rounded border hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Review again
                  </button>
                  <button
                    onClick={submitOrder}
                    className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting…' : 'Confirm order'}
                  </button>
                </div>
                </div>
              )}

              {submitStatus === 'success' && (
                <>
                  <button
                    onClick={handleCloseAll}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    Close
                  </button>
                  {/* opcional: botón a "My Orders" si tienes ruta */}
                  {/* <Link to="/account/orders" className="px-4 py-2 rounded border hover:bg-gray-50">View my orders</Link> */}
                </>
              )}

              {submitStatus === 'error' && (
                <>
                  <button
                    onClick={handleCloseAll}
                    className="px-4 py-2 rounded border hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={submitOrder}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting…' : 'Try again'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlaceOrderForm;
