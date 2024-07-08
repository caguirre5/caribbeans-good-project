import React, { useState } from 'react';
import image from '../../assets/Images/All/Medina-28 - Copy.jpg'

interface OrderFormProps {
  onBack: () => void;
}

const ReserveForm: React.FC<OrderFormProps> = ({ onBack }) => {
  const [bags, setBags] = useState<number>(0);
  const [pickupOrDelivery, setPickupOrDelivery] = useState<string>('pickup');
  const [deliveries, setDeliveries] = useState<number>(1);
  const [weeks, setWeeks] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');

  const calculateBagsPerWeek = () => {
    if (weeks > 0 && deliveries > 0) {
      return Math.ceil(bags / (weeks * deliveries));
    }
    return 0;
  };

  return (
    <div className="bg-[#c9d3c0] p-10 lg:flex lg:items-center lg:justify-center lg:space-x-8 text-white w-[80%]">
      <form className="lg:w-1/2 space-y-4">
        <button 
          type="button" 
          onClick={onBack} 
          className="underline mb-4"
        >
          Back to menu
        </button>
        <h1 className="text-2xl lg:text-4xl font-bold mb-4">Reserve</h1>
        <p className="mb-4">Place your order with us and we will be in touch within 24 hours to confirm, give final cost and take payment</p>
        <div>
          <label className="block font-semibold">Company</label>
          <input type="text" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Company" />
        </div>
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block font-semibold">First name *</label>
            <input type="text" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="First name" />
          </div>
          <div className="w-1/2">
            <label className="block font-semibold">Last name *</label>
            <input type="text" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Last name" />
          </div>
        </div>
        <div>
          <label className="block font-semibold">Email *</label>
          <input type="email" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Email" />
        </div>
        <div>
          <label className="block font-semibold">Phone</label>
          <input type="tel" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Phone" />
        </div>
        <div>
          <label className="block font-semibold">Shipping Address *</label>
          <input type="text" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Shipping Address" />
        </div>
        <div>
          <label className="block font-semibold">Preferred Delivery Date *</label>
          <input type="date" className="w-full bg-transparent border-b-2 border-white outline-none py-1" />
          <small className="block mt-1 text-gray-600">please allow 3 days from today's date</small>
        </div>
        <div>
          <label className="block font-semibold">Delivery Address (Orders take up to 48 working hours for delivery)</label>
          <input type="text" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Delivery Address" />
        </div>
        <div>
          <label className="block font-semibold">Which coffee would you like to buy?</label>
          <input type="text" className="w-full bg-transparent border-b-2 border-white outline-none py-1" placeholder="Coffee Type" />
        </div>
        <div>
          <label className="block font-semibold">How many bags (each bag weighs 30 kg)</label>
          <input 
            type="number" 
            className="w-full bg-transparent border-b-2 border-white outline-none py-1"
            value={bags} 
            onChange={(e) => setBags(parseInt(e.target.value) || 0)} 
            placeholder="Number of bags" 
          />
        </div>
        <div>
          <label className="block font-semibold">Total Kg</label>
          <input 
            type="number" 
            className="w-full bg-transparent border-b-2 border-white outline-none py-1"
            value={bags * 30} 
            readOnly 
            placeholder="Total Kg" 
          />
        </div>

        <div>
          <label className="block font-semibold">Would you like to pick it up yourself or get it delivered?</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                className="mr-2" 
                value="pickup" 
                checked={pickupOrDelivery === 'pickup'} 
                onChange={() => setPickupOrDelivery('pickup')} 
              />
              Pickup
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                className="mr-2" 
                value="delivery" 
                checked={pickupOrDelivery === 'delivery'} 
                onChange={() => setPickupOrDelivery('delivery')} 
              />
              Delivery
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold">How many deliveries (or pick ups) would you like?</label>
          <input 
            type="number" 
            className="w-full bg-transparent border-b-2 border-white outline-none py-1"
            value={deliveries} 
            onChange={(e) => setDeliveries(parseInt(e.target.value) || 0)} 
            placeholder="Number of deliveries" 
          />
        </div>
        <div>
          <label className="block font-semibold">How often would you like to pick up coffee? (Weeks)</label>
          <input 
            type="number" 
            className="w-full bg-transparent border-b-2 border-white outline-none py-1"
            value={weeks} 
            onChange={(e) => setWeeks(parseInt(e.target.value) || 0)} 
            placeholder="Number of weeks" 
          />
        </div>
        <div>
          <label className="block font-semibold">When would you like to start?</label>
          <input 
            type="date" 
            className="w-full bg-transparent border-b-2 border-white outline-none py-1"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            placeholder="Start date" 
          />
        </div>

        <div>
            <p className="mt-8 p-4 bg-[#c9d3c0] text-white text-lg rounded-md">
                You will {pickupOrDelivery} {calculateBagsPerWeek()} bag(s) every {weeks} week(s).
            </p>
        </div>

        
        <button type="submit" className="mt-[100px] bg-[#044421] text-white py-2 px-4 rounded">Submit Order</button>
      </form>
      <div className="hidden lg:block lg:w-1/2">
        <img src={image} alt="Coffee beans" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default ReserveForm;
