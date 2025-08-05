import React, { useState, useEffect } from 'react';

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

const DELIVERY_COSTS = {
  economy: 75,
  express: 95,
  saturday: 100,
};

const PlaceOrderForm: React.FC = () => {
  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [selectedVariety, setSelectedVariety] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);

  const [coffeeSelections, setCoffeeSelections] = useState<CoffeeSelection[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryType, setDeliveryType] = useState<'economy' | 'express' | 'saturday'>('economy');

  const approvedPostcode = true; // Simulación por ahora

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

        setSheetData(formatted);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalBags = coffeeSelections.reduce((acc, item) => acc + item.amount, 0);
    const baseTotal = coffeeSelections.reduce((acc, item) => acc + item.amount * 30 * item.price, 0);
    const deliveryFee = baseTotal >= 300 || totalBags >= 15 ? 0 : DELIVERY_COSTS[deliveryType];
    const finalTotal = baseTotal + deliveryFee;

    const orderDescription = coffeeSelections
      .map(item => `${item.amount} 30kg bags of ${item.variety} green coffee beans`)
      .join('; ');

    const priceDetails = coffeeSelections
      .map(item => `${item.variety} – £${item.price}`)
      .join('; ');

    console.log("📦 Order Description:", orderDescription);
    console.log("💷 Price Details:", priceDetails);
    console.log("📅 Delivery Date:", deliveryDate);
    console.log("🚚 Delivery Type:", deliveryType);
    console.log("💰 Final Total:", finalTotal);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h2 className="text-xl font-bold">Place Your Coffee Order</h2>

      {/* Select variety */}
      <div>
        <label className="block font-medium mb-1">Select Variety</label>
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
          <label className="block font-medium mb-1">Bags (30kg each)</label>
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
            Add Variety
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
