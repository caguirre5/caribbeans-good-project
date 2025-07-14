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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#c9d3c0] px-6">
        <div className="bg-white rounded-lg shadow-md p-12 max-w-5xl text-center">
          <h2 className="text-2xl font-bold text-[#044421] mb-4">
            We’ve got your request, hang tight! ☕
          </h2>
          <p className="mb-4">
            Just popping in to say we’ve received your request to join our portal. Awesome to have you on board! 
          </p>
          <p className="mb-4">
            <strong className="text-[#044421]">Quick heads-up:</strong> this is a roasters-only site. We display pictures and stories of people behind the coffee, and we’ve made a promise to share these only with folks who actively roast coffee.
          </p>
          <p className="mb-4">
            If you’re already roasting, brilliant! We’ll get back to you ASAP to get you all set up.
          </p>
          <p className="mb-4">
            If you’re thinking about roasting, that’s exciting! Just drop us an email at{" "}
            <a href="mailto:info@caribbeangoods.co.uk" className="text-blue-600 underline">
              info@caribbeangoods.co.uk
            </a>{" "}
            and we’ll be happy to chat 😊
          </p>
          <p className="mb-4">
            In the meantime, if you have any questions (or just want to talk coffee), don’t hesitate to reach out.
          </p>
          <p className="mb-6">
            Thanks for getting in touch!
            <br />
            Cheers,
            <br /><br/>
            The Caribbean Goods Team 🌴
          </p>
          <Link to="/" className="inline-block">
            <button className="px-6 py-2 mt-4 text-white bg-[#044421] hover:bg-[#033914] rounded-full">
              Return to Home
            </button>
          </Link>
        </div>
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
