import React, { useState, useEffect } from 'react';
import image from '../../assets/Images/All/Medina-28 - Copy.jpg'

interface OrderFormProps {
  onBack: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onBack }) => {
  const [bags, setBags] = useState<number>(0);
  const [freeBags, setFreeBags] = useState<number>(0);

  useEffect(() => {
    const freeBags = Math.floor(bags / 12);
    setFreeBags(freeBags);
  }, [bags]);

  return (
    <div className="bg-[#9da793] p-10 lg:flex lg:items-center lg:justify-center lg:space-x-8 text-white w-[80%]">
      <form className="lg:w-1/2 space-y-4">
        <button 
          type="button" 
          onClick={onBack} 
          className="underline mb-4"
        >
          Back to menu
        </button>
        <h1 className="text-2xl lg:text-4xl font-bold mb-4">Order Form</h1>
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
          {freeBags > 0 && (
            <small className="block mt-1 text-[#044421]">You have earned {freeBags} free bag(s)!</small>
          )}
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
        <button type="submit" className=" bg-[#044421] text-white py-2 px-4 rounded ">Submit Order</button>
      </form>
      <div className="hidden lg:block lg:w-1/2 ">
        <img src={image} alt="Coffee beans" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default OrderForm;
