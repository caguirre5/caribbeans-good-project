import React, { useEffect, useState } from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import PortalHome from './pages/Portal/Home';
import Profile from './components/Profile';
import { useAuth } from './contexts/AuthContext'; // Importa el AuthContext
import { DataProvider } from './contexts/Datacontent';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebase'; // Importa tu configuración de Firebase
import Forum from './pages/Portal/Forum';
import MyOrders from './pages/Portal/Orders';


export const updateLastLogin = async (user: any) => {
  try {
    const token = await user.getIdToken();
    await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/users/${user.uid}/last-login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error('Failed to update last login:', err);
  }
};


const ProtectedRoutes: React.FC = () => {
  const { currentUser } = useAuth(); // Usa useAuth para acceder al usuario autenticado
  const [isActive, setIsActive] = useState<boolean | null>(null); // Estado para guardar si el usuario está activo

  useEffect(() => {
    const checkUserIsActive = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsActive(userData?.isActive || false);
          await updateLastLogin(currentUser);
        } else {
          setIsActive(false); // Usuario no encontrado, tratar como inactivo
        }
      }
    };

    checkUserIsActive();
  }, [currentUser]);

  if (isActive === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#c9d3c0]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#044421]"></div>
      </div>
    );
  }

  if (!currentUser || !isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#c9d3c0]">
        <div className="text-center w-[90%] text-[#044421] text-2xl font-semibold">
          You need to be an active user to view this content.
        </div>
        <p className="text-sm mt-4 text-center mb-6 w-[90%] lg:w-[28%]">
          Your account has been successfully created, but it is still pending approval. Please wait for your account to be activated by our team.
        </p>
        <Link to="/" className="mt-6">
          <button className="px-6 py-2 text-white bg-[#044421] hover:bg-[#033914] rounded-full">
            Return to Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <DataProvider>
      <Routes>
        <Route path='/Portal' element={<PortalHome />} />
        <Route path='/MyAccount' element={<Profile />} />
        <Route path='/Forum' element={<Forum />} />
        <Route path='/MyOrders' element={<MyOrders/>} />
      </Routes>
    </DataProvider>
  );
};

export default ProtectedRoutes;
