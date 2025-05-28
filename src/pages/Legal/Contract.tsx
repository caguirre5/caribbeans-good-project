import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../firebase/firebase'; // Asegúrate de importar tu instancia de Firestore
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';

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
}

interface Props {
  currentUser: User | null;
}

interface SheetData {
  Farm: string;
  Variety: string;
  Process: string;
  'Our Tasting Notes': string;
  '30 KG Sacks': string;
  Price: string;
  '12 bags Bundle + 1 Free': string;
}


const initialFormState: Replacements = {
  ENTITY: '',
  CITY: '',
  COMPNUMBER: '',
  REGISTEREDOFFICE: '',
  CUSTOMERCOMPANYNAME: '',
  NAME: '',
  NUMBER: '',
  EMAIL: '',
  AMOUNT: '',
  VARIETY: '',
  PRICE: '',
  MONTHS: '',
  MONTH1: '',
  YEAR1: '',
  MONTH2: '',
  YEAR2: '',
  FREQUENCY: ''
};

const ContractForm: React.FC<Props> = ({ currentUser }) => {
  const [formData, setFormData] = useState<Replacements>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState<{ [K in keyof Replacements]?: boolean }>({});

  useEffect(() => {
    const SHEET_ID = '1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE'; // Reemplaza con el ID de tu hoja de cálculo
    const API_KEY = 'AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k'; // Reemplaza con tu clave de API
    const RANGE = 'Sheet1!A:G'; // Asegúrate de que el rango cubra todas las columnas
  
    const fetchSheetData = async () => {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        const response = await axios.get(url);
        const rows = response.data.values;
  
        const formatted = rows.slice(1).map((row: string[]) => ({
          Farm: row[0],
          Variety: row[1],
          Process: row[2],
          'Our Tasting Notes': row[3],
          '30 KG Sacks': row[4],
          Price: row[5],
          '12 bags Bundle + 1 Free': row[6],
        }));
  
        setSheetData(formatted);
      } catch (error) {
        console.error('Error loading sheet data:', error);
      }
    };
  
    fetchSheetData();
  }, []);
  
  

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        return;
      }
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // console.log("📥 Datos del usuario:", userData);

          setFormData((prev) => ({
            ...prev,
            ENTITY: userData.company || '',
            CITY: userData.companyCity || '',
            REGISTEREDOFFICE: userData.companyAddress || '',
            CUSTOMERCOMPANYNAME: userData.company || '',
            NAME: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            EMAIL: userData.email || '',
            NUMBER: userData.phoneNumber || '',
            SIGNATORYNAME: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleVarietySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = sheetData.find(item => `${item.Variety} (${item.Farm})` === e.target.value);
    if (selected) {
      const pricePerKg = parseFloat(selected.Price.replace('£', '').trim());
      const availableSacks = parseInt(selected['30 KG Sacks']);
  
      setStockAvailable(availableSacks);
  
      setFormData((prev) => ({
        ...prev,
        VARIETY: e.target.value,
        PRICE: pricePerKg.toString(),
      }));
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(e.target.value);
    if (stockAvailable !== null && amount > stockAvailable) {
      alert(`Only ${stockAvailable} bags available.`);
      return;
    }
  
    setFormData((prev) => ({
      ...prev,
      AMOUNT: e.target.value,
    }));
  };
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const isValid = validateForm();
    if (!isValid) {
      setLoading(false);
      setMessage('Please fill out all required fields.');
      return;
    }

    const amount = parseInt(formData.AMOUNT);
    const bagLabel = amount === 1 ? 'bag' : 'bags';

    const todayUK = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    

    const replacementsToSend = {
      ...formData,
      ENTITY: formData.CUSTOMERCOMPANYNAME,
      SIGNATORYNAME: formData.NAME,
      TOTALAMOUNT: formData.AMOUNT ? (parseInt(formData.AMOUNT) * 24).toString() : '0',
      BAGS:bagLabel,
      PREFIX: formData.FREQUENCY === 'annually' ? 'an' : 'a',
      DATE: todayUK,
    };

    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/docx/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        

        body: JSON.stringify({ replacements: replacementsToSend }),

      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error generating contract');

      setMessage(result.message || 'Contract succesfully generated');
      setSuccess(true);

    } catch (error: any) {
      console.error("❌ Error sending:", error);
      setMessage(error.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const calculateReservationPeriod = (start: string, end: string) => {
    if (!start || !end) return;
  
    const [startYear, startMonth] = start.split('-').map(Number);
    const [endYear, endMonth] = end.split('-').map(Number);
  
    const months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
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
  const newErrors: { [K in keyof Replacements]?: boolean } = {};

  // Campos que NO deben validarse porque se llenan automáticamente
  const excludedKeys: (keyof Replacements)[] = [
    'PRICE',
    'ENTITY',
    'MONTHS',
    'MONTH1',
    'YEAR1',
    'MONTH2',
    'YEAR2'
  ];

  for (const key in formData) {
    if (
      !excludedKeys.includes(key as keyof Replacements) &&
      formData[key as keyof Replacements].trim() === ''
    ) {
      newErrors[key as keyof Replacements] = true;
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  
  
  

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 bg-white shadow-md rounded">
      {success ? (
        <div className="text-center text-gray-800">
          <h2 className="text-xl font-bold text-green-700 mb-4">Contract Sent!</h2>
          <p className="mb-2">To complete your order, please follow these simple steps:</p>
          <ol className="list-decimal list-inside text-left max-w-md mx-auto space-y-2">
            <li>Check your email inbox — we’ve just sent you the contract.</li>
            <li>Download the attached contract file.</li>
            <li>Sign the contract (you can sign it digitally or by hand).</li>
            <li>Send the signed contract to <strong>info@caribbeangoods.co.uk</strong>.</li>
          </ol>
          <p className="mt-4 font-medium text-red-600">
            Please note: your order is not complete yet.
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Once you’ve completed all the steps and sent the signed contract by email, our team will review it. If everything is correct, we’ll approve it and confirm that your order is officially accepted.
          </p>
        </div>      
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto p-4 bg-white shadow-md rounded">
        <h2 className="text-xl font-bold mb-4 text-center">Legal agreement</h2>

  {/* ----------------------------------------------------------------------------------- */}

        <h3 className="text-lg font-semibold mt-6">Customer Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="NAME"
              value={formData.NAME}
              onChange={handleChange}
              required
              className={`w-full rounded px-3 py-2 border ${
                errors['NAME'] ? 'border-red-500' : 'border-gray-300'
              }`}
              
            />
          </div>

          <div>
            <label className="block font-medium mb-1">City</label>
            <input
              type="text"
              name="CITY"
              value={formData.CITY}
              onChange={handleChange}
              required
              className={`w-full rounded px-3 py-2 border ${
                errors['CITY'] ? 'border-red-500' : 'border-gray-300'
              }`}          />
          </div>

          <div>
            <label className="block font-medium mb-1">Company Number</label>
            <input
              type="text"
              name="COMPNUMBER"
              value={formData.COMPNUMBER}
              onChange={handleChange}
              required
              className={`w-full rounded px-3 py-2 border ${
                errors['COMPNUMBER'] ? 'border-red-500' : 'border-gray-300'
              }`}           />
          </div>

          <div className="col-span-2">
            <label className="block font-medium mb-1">Office Address</label>
            <input
              type="text"
              name="REGISTEREDOFFICE"
              value={formData.REGISTEREDOFFICE}
              onChange={handleChange}
              required
              className={`w-full rounded px-3 py-2 border ${
                errors['REGISTEREDOFFICE'] ? 'border-red-500' : 'border-gray-300'
              }`}           />
          </div>

          <div className="col-span-2">
            <label className="block font-medium mb-1">Customer Company Name</label>
            <input
              type="text"
              name="CUSTOMERCOMPANYNAME"
              value={formData.CUSTOMERCOMPANYNAME}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Phone</label>
            <input
              type="text"
              name="NUMBER"
              value={formData.NUMBER}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              name="EMAIL"
              value={formData.EMAIL}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

  {/* ----------------------------------------------------------------------------------- */}
        
        <hr />

        <h3 className="text-lg font-semibold mt-6">Order Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Select Variety</label>
            <select
              name="VARIETY"
              value={formData.VARIETY}
              onChange={handleVarietySelect}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">-- Select a coffee --</option>
              {sheetData.map((item, i) => (
                <option key={i} value={`${item.Variety} (${item.Farm})`}>
                  {item.Variety} ({item.Farm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Bags (24kg each)</label>
            <input
              type="number"
              name="AMOUNT"
              value={formData.AMOUNT}
              onChange={handleAmountChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={1}
            />
            {stockAvailable !== null && (
              <p className="text-sm text-gray-500 mt-1">
                Available: {stockAvailable} bags
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Unit Price (£/kg)</label>
            <input
              type="text"
              name="PRICE"
              value={formData.PRICE}
              disabled
              className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 text-gray-700"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Estimated Total Price (£)</label>
            <input
              type="text"
              value={
                formData.AMOUNT && formData.PRICE
                  ? (parseInt(formData.AMOUNT) * 30 * parseFloat(formData.PRICE)).toFixed(2)
                  : '0.00'
              }
              disabled
              className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 text-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Total KG</label>
          <input
            type="text"
            value={
              formData.AMOUNT
                ? `${parseInt(formData.AMOUNT) * 24} kg`
                : '0 kg'
            }
            disabled
            className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 text-gray-700"
          />
        </div>


  {/* ----------------------------------------------------------------------------------- */}

        <hr />

        <h3 className="text-lg font-semibold mt-6">Reservation Period</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Start Month</label>
            <input
              type="month"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                calculateReservationPeriod(e.target.value, endDate);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">End Month</label>
            <input
              type="month"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                calculateReservationPeriod(startDate, e.target.value);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block font-medium mb-1">Total Duration (in months)</label>
          <input
            type="text"
            value={formData.MONTHS}
            disabled
            className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2 text-gray-700"
          />
        </div>

  {/* ----------------------------------------------------------------------------------- */}

        <hr />

        <h3 className="text-lg font-semibold mt-6">Delivery Frequency</h3>

        <div>
          <label className="block font-medium mb-1">Select delivery frequency</label>
          <select
            name="FREQUENCY"
            value={formData.FREQUENCY}
            onChange={handleChange}
            required
            className={`w-full rounded px-3 py-2 border ${
              errors.FREQUENCY ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">-- Select an option --</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
          </select>
        </div>



        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate contract'}
        </button>

        {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
      </form>
      )}
    </div>
  );
};

export default ContractForm;
