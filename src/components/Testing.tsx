import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase/firebase'; // Asegúrate de importar tu instancia de Firestore
import { doc, getDoc } from 'firebase/firestore';

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
  DIVISION: string;
  SIGNATORYNAME: string;
}

interface Props {
  currentUser: User | null;
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
  FREQUENCY: '',
  DIVISION: '',
  SIGNATORYNAME: '',
};

const ContractForm: React.FC<Props> = ({ currentUser }) => {
  const [formData, setFormData] = useState<Replacements>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        console.log("🔴 currentUser no está definido");
        return;
      }
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log("📥 Datos del usuario:", userData);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/docx/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ replacements: formData }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al generar el contrato');

      setMessage(result.message || 'Contrato generado y enviado correctamente');
    } catch (error: any) {
      console.error("❌ Error al enviar:", error);
      setMessage(error.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4 text-center">Contrato</h2>

      {Object.entries(formData).map(([key, value]) => (
        <div key={key}>
          <label className="block font-medium mb-1">{key}</label>
          <input
            type="text"
            name={key}
            value={value}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      ))}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Generar y Enviar Contrato'}
      </button>

      {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
    </form>
  );
};

export default ContractForm;
