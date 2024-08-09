import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { useData } from '../../contexts/Datacontent';

interface DeliverySchedule {
  month: string;
  quantity: string;
}

interface FormData {
  date: string;
  purchaserCompanyName: string | undefined;
  purchaserCompanyAddress: string | undefined;
  purchaserCityPostalCountry: string | undefined;
  purchaserContactName: string | undefined;
  purchaserEmail: string;
  purchaserPhone: string;
  coffeeVarietal: string;
  process: string;
  totalQuantity: string;
  numberOfMonths: string;
  deliverySchedule: DeliverySchedule[];
  pricePerKg: string;
  paymentDays: string;
  paymentMethod: string;
  deliveryAddress: string;
}

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CoffeeSupplyAgreementForm: React.FC = () => {
  const { data } = useData();
  const { user } = useAuth0();
  const [formData, setFormData] = useState<FormData>({
    date: getCurrentDate(),
    purchaserCompanyName: user?.name,
    purchaserCompanyAddress: '',
    purchaserCityPostalCountry: '',
    purchaserContactName: '',
    purchaserEmail: '',
    purchaserPhone: '',
    coffeeVarietal: '',
    process: '-',
    totalQuantity: '',
    numberOfMonths: '',
    deliverySchedule: [{ month: '', quantity: '' }],
    pricePerKg: '-',
    paymentDays: '30',
    paymentMethod: '',
    deliveryAddress: '',
  });

  const inputClass = "block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none p-2.5";
  const labelClass = "block text-gray-700";
  const containerClass = "mb-4";


  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    index?: number,
    field?: keyof DeliverySchedule
  ) => {
    const { name, value } = e.target;
  
    if (field !== undefined && index !== undefined) {
      const updatedSchedule = [...formData.deliverySchedule];
      updatedSchedule[index] = {
        ...updatedSchedule[index],
        [field]: value,
      };
      setFormData({ ...formData, deliverySchedule: updatedSchedule });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  
    // Actualiza el cronograma de entrega si cambian los valores de cantidad total o número de meses
    if (name === 'totalQuantity' || name === 'numberOfMonths') {
      updateDeliverySchedule(
        name === 'totalQuantity' ? parseInt(value) : parseInt(formData.totalQuantity),
        name === 'numberOfMonths' ? parseInt(value) : parseInt(formData.numberOfMonths)
      );
    }
  };  
  

  const updateDeliverySchedule = (totalQuantity: number, numberOfMonths: number) => {
    if (totalQuantity && numberOfMonths && numberOfMonths <= totalQuantity) {
      // Cantidad base por mes
      const baseQuantity = Math.floor(totalQuantity / numberOfMonths);
      // Resto a distribuir
      const remainder = totalQuantity % numberOfMonths;
      // Genera el nuevo cronograma
      const newSchedule = Array.from({ length: numberOfMonths }, (_, index) => ({
        month: `Month ${index + 1}`,
        quantity: `${baseQuantity + (index < remainder ? 1 : 0)}`
      }));
      // Actualiza el estado del formulario con el nuevo cronograma
      setFormData({ ...formData, deliverySchedule: newSchedule });
    }
  };

  const handleVarietyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVariety = e.target.value;
    const selectedData = data.find(item => `${item.Variety} (${item.Farm})` === selectedVariety);
  
    if (selectedData) {
      setFormData({
        ...formData,
        coffeeVarietal: selectedVariety,  // Actualiza esta línea
        process: selectedData.Process,
        pricePerKg: selectedData.Price.replace('£ ', '')
      });
    }
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  const generatePDFContent = (data: FormData): string[] => {
    let deliveryScheduleText = '';
    data.deliverySchedule.forEach((schedule, index) => {
      deliveryScheduleText += `- Month ${index + 1}: ${schedule.quantity} kg\n`;
    });

    const content = `
### Coffee Supply Agreement

**This Coffee Supply Agreement ("Agreement") is made and entered into as of ${data.date}, by and between:**

**Supplier:**
Caribbean Goods Ltd
Rooms 6.01-6.13. Strathclyde Inspire
Graham Hills Building. 50 Richmond St.
Glasgow. G1 1XN

Contact Person: Javier Enrique Gutierrez Abril
Email: info@caribbeangoods.co.uk
Telephone: +447413981290

**Purchaser:**
${data.purchaserCompanyName}
${data.purchaserCompanyAddress}
${data.purchaserCityPostalCountry}
Contact Person: ${data.purchaserContactName}
Email: ${data.purchaserEmail}
Telephone: ${data.purchaserPhone}

**Recitals**

WHEREAS, the Supplier is engaged in the business of importing and selling green coffee;
WHEREAS, the Purchaser is engaged in the business of roasting and selling coffee;
WHEREAS, the Purchaser wishes to book certain quantities of green coffee from the Supplier over a specified period;

NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the parties hereto agree as follows:

### 1. **Product Description and Quality**

The Supplier agrees to supply, and the Purchaser agrees to purchase, the following green coffee:
- ${data.process} ${data.coffeeVarietal}

### 2. **Quantity and Delivery Schedule**

The Purchaser agrees to book and purchase a total quantity of ${data.totalQuantity} kg over a period of ${data.numberOfMonths} months, according to the following schedule:
${deliveryScheduleText}

### 3. **Price and Payment Terms**

3.1. **Price**: The price per kilogram of green coffee is £ ${data.pricePerKg} GBP.

3.2. **Payment Terms**: Payment for each shipment shall be made within ${data.paymentDays} days of the delivery date. Payments shall be made via ${data.paymentMethod}.

3.3. **Late Payments**: Any payments not made within the specified period shall incur a late fee of 1% per late week.

### 4. **Delivery Terms**

4.1. **Delivery Location**: The green coffee shall be delivered to ${data.deliveryAddress}.

4.2. **Delivery Schedule**: Deliveries shall be made according to the schedule specified in Section 2.

4.3. **Risk of Loss**: Risk of loss and title to the green coffee shall pass to the Purchaser upon delivery at the specified location.

### 5. **Acceptance and Inspection**

5.1. The Purchaser shall inspect the delivered coffee within 5 business days of receipt. If the coffee does not meet the agreed specifications, the Purchaser shall notify the Supplier in writing within 7-10 days of inspection.

5.2. The Supplier shall replace any non-conforming coffee at no additional cost to the Purchaser.

### 6. **Force Majeure**

Neither party shall be liable for any delay or failure in performance due to events beyond their reasonable control, including but not limited to acts of God, war, strikes, or government regulations.

### 7. **Termination**

This Agreement may be terminated by either party with 30 days' written notice if the other party breaches any material term of this Agreement and fails to cure such breach within 30 days of receiving notice of the breach.

### 8. **Governing Law**

This Agreement shall be governed by and construed in accordance with the laws of England and Wales.

### 9. **Dispute Resolution**

Any disputes arising out of or in connection with this Agreement shall be resolved through negotiation in good faith. If the dispute cannot be resolved through negotiation, it shall be submitted to mediation or arbitration as agreed by the parties.

### 10. **Entire Agreement**

This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings, whether written or oral, relating to the subject matter hereof.

**IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the day and year first above written.**

**Supplier:**
Caribbean Goods Ltd

By: _______________________________
Name: Javier Enrique Gutierrez Abril

**Purchaser:**
${data.purchaserCompanyName}

By: _______________________________
Name: ${data.purchaserContactName}
  `;

    const lines = content.split('\n');
    return lines;
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();
    const content = generatePDFContent(formData);

    doc.setFontSize(12);
    doc.autoTable({
      head: [],
      body: content.map(line => [line]),
      theme: 'plain',
      styles: { font: 'courier', fontSize: 12 },
      startY: 10,
      margin: { left: 10, right: 10 },
      pageBreak: 'auto',
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    navigate('/pdf-viewer', { state: { pdfUrl } });
  };

  const renderInput = (label: string, name: keyof FormData, type: string = 'text') => {
    return (
      <div className={containerClass}>
        <label className={labelClass}>{label}</label>
        <input
          type={type}
          name={name}
          value={String(formData[name])}
          onChange={handleChange}
          className={inputClass}
        />
      </div>
    );
  };  

  const renderDropdown = (label: string, name: keyof FormData, options: string[]) => {
    return (
      <div className={containerClass}>
        <label className={labelClass}>{label}</label>
        <select
          name={name}
          value={formData[name] as string}
          onChange={handleVarietyChange}
          className={inputClass}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  };
  

  const renderPaymentDaysDropdown = () => {
    const options = ['30 days', 'Cash on Delivery'];
    return (
      <div className="mb-4">
        <label className="block text-gray-700">Payment Terms</label>
        <select
          name="paymentDays"
          value={formData.paymentDays}
          onChange={handleChange}
          className={inputClass}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  };
  
  const renderFixedText = (label: string, value: string) => {
    return (
      <div className={containerClass}>
        <label className={labelClass}>{label}</label>
        <p className={`${inputClass} bg-gray-100`}>{value}</p>
      </div>
    );
  };
  
  
  
  const calculateTotalAmount = () => {
    const totalQuantity = parseInt(formData.totalQuantity);
    const pricePerKg = parseFloat(formData.pricePerKg);
    if (!isNaN(totalQuantity) && !isNaN(pricePerKg)) {
      return (totalQuantity * pricePerKg).toFixed(2);
    }
    return '0.00';
  };

  const coffeeVarietyOptions = data.map(item => `${item.Variety} (${item.Farm})`);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded">
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6">Coffee Supply Agreement</h2>
  
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Date', 'date', 'date')}
          {renderInput('Purchaser Company Name', 'purchaserCompanyName')}
        </div>
        
        <h3 className="text-xl font-semibold mb-4">Purchaser</h3>
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Company Address', 'purchaserCompanyAddress')}
          {renderInput('City, Postal Code, Country', 'purchaserCityPostalCountry')}
          {renderInput('Contact Name', 'purchaserContactName')}
          {renderInput('Email', 'purchaserEmail')}
          {renderInput('Phone', 'purchaserPhone')}
        </div>
  
        <h3 className="text-xl font-semibold mb-4">Product Description and Quality</h3>
        {renderDropdown('Coffee Varietal (Farm)', 'coffeeVarietal', coffeeVarietyOptions)}
        <div className="grid grid-cols-2 gap-4">
          {renderFixedText('Process', formData.process)}
          {renderFixedText('Price per KG', formData.pricePerKg)}
        </div>
  
        <h3 className="text-xl font-semibold mb-4">Quantity and Delivery Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          {renderInput('Total Quantity (kg)', 'totalQuantity', 'number')}
          {renderInput('Number of Months', 'numberOfMonths', 'number')}
        </div>
        <h4 className="text-lg font-semibold mb-2">Calculated Monthly Deliveries</h4>
        {formData.deliverySchedule.map((schedule, index) => (
          <div key={index} className="mb-2">
            <span>{schedule.month}: {schedule.quantity} kg</span>
          </div>
        ))}
  
        <h3 className="text-xl font-semibold mb-4">Price and Payment Terms</h3>
        {renderFixedText('Total Amount', `£ ${calculateTotalAmount()} GBP`)}
        {renderPaymentDaysDropdown()}
        {renderInput('Payment Method', 'paymentMethod')}
  
        <h3 className="text-xl font-semibold mb-4">Delivery Terms</h3>
        {renderInput('Delivery Address', 'deliveryAddress')}
  
        <button
          type="button"
          onClick={handleGeneratePdf}
          className="py-2 px-4 bg-[#e6a318] text-white rounded-full shadow-md hover:bg-[#ca8e15] mt-4"
        >
          Generate agreement
        </button>
      </form>
    </div>
  );
  
};

export default CoffeeSupplyAgreementForm;
