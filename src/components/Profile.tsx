import React, { useEffect, useState } from "react";
import Header from "./HeaderControls";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext"; // Importa tu AuthContext para obtener el usuario autenticado
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Importa métodos necesarios de Firestore
import { db } from "../firebase/firebase"; // Importa la configuración de Firestore

const Profile: React.FC = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<any>({});
    const [originalData, setOriginalData] = useState<any>({}); // Almacena los datos originales
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

    // Obtener la información del usuario de Firestore al montar el componente
    useEffect(() => {
        const fetchUserData = async () => {
        if (!currentUser) return;
    
        try {
            const userRef = doc(db, "users", currentUser.uid); // Referencia al documento del usuario
            const userSnap = await getDoc(userRef); // Obtén el documento del usuario
    
            if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setOriginalData(data); // Almacena los datos originales
            setIsProfileIncomplete(!data.profileCompleted); // Verifica si el perfil está completo
            }
        } catch (err) {
            setError("Failed to load user data.");
        } finally {
            setLoading(false);
        }
        };
    
        fetchUserData();
    }, [currentUser]);

  // Actualizar la información del usuario en Firestore
  const handleUpdateInfo = async () => {
    if (!currentUser) return;

    const updatedData: any = {};

    // Actualizar solo los campos que han cambiado
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== originalData[key]) {
        updatedData[key] = userData[key];
      }
    });

    // Verifica si el perfil está completo solo si se actualizó algún campo
    if (Object.keys(updatedData).length > 0) {
        const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'title', 'company', 'companyWebsite', 'position'];
        const profileCompleted = requiredFields.every((field) => userData[field] && userData[field].trim() !== '');
      
        if (profileCompleted) {
          updatedData.profileCompleted = true;
        } else {
          updatedData.profileCompleted = false;
        }
      
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, updatedData); // Solo actualiza los campos modificados
            alert("User info updated successfully!");
            setOriginalData({ ...originalData, ...updatedData }); // Actualiza los datos originales
            setUserData({ ...userData, ...updatedData }); // Actualiza el estado del usuario con los datos modificados
          
            // Actualiza la bandera `isProfileIncomplete` después de actualizar los datos
            setIsProfileIncomplete(!updatedData.profileCompleted);
        } catch (err) {
            setError("Failed to update user data.");
        }
    } else {
        alert("No changes detected to update.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto p-4 mt-20">
        <h2 className="text-2xl font-bold mb-4">Account Details</h2>
        {isProfileIncomplete && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
            <p className="font-bold">Incomplete Profile</p>
            <p>To make purchases and reservations, please complete your profile information.</p>
        </div>
        )}

        <div className="bg-gray-100 p-4 rounded-lg">
          {/* Campos de First Name, Last Name y Title */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={userData.firstName || ""}
                onChange={(e) =>
                  setUserData({ ...userData, firstName: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={userData.lastName || ""}
                onChange={(e) =>
                  setUserData({ ...userData, lastName: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={userData.title || ""}
                onChange={(e) =>
                  setUserData({ ...userData, title: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Información del Perfil */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Personal info</h3>
            <p className="mt-1 text-sm text-gray-600">
              Update your personal information.
            </p>
          </div>

          {/* Resto de los campos */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mt-4">
            <div className="sm:col-span-6">
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700"
              >
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={userData.company || ""}
                onChange={(e) =>
                  setUserData({ ...userData, company: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-6">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={userData.phoneNumber || ""}
                onChange={(e) =>
                  setUserData({ ...userData, phoneNumber: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-6">
              <label
                htmlFor="companyWebsite"
                className="block text-sm font-medium text-gray-700"
              >
                Company Website
              </label>
              <input
                type="text"
                id="companyWebsite"
                name="companyWebsite"
                value={userData.companyWebsite || ""}
                onChange={(e) =>
                  setUserData({ ...userData, companyWebsite: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-6">
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-700"
              >
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={userData.position || ""}
                onChange={(e) =>
                  setUserData({ ...userData, position: e.target.value })
                }
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">
                Profile Image
              </label>
              <div className="mt-2 flex items-center">
                <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                  <img src={userData.photoURL || ""} alt="Profile" />
                </span>
                <button
                  type="button"
                  className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Botones para actualizar y descartar */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleUpdateInfo}
            >
              Update Info
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
