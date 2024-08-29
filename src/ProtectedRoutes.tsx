import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PortalHome from './pages/Portal/Home';
import Profile from './components/Profile';
import { useAuth } from './contexts/AuthContext'; // Importa el AuthContext
import { DataProvider } from './contexts/Datacontent';

const ProtectedRoutes: React.FC = () => {
  const { currentUser } = useAuth(); // Usa useAuth para acceder al usuario autenticado

  if (!currentUser) { // Verifica si el usuario no está autenticado
    return <div>You need to be authenticated to view this content.</div>;
  }

  return (
    <DataProvider>
      <Routes>
        <Route path='/Portal' element={<PortalHome />} />
        <Route path='/MyAccount' element={<Profile />} />
      </Routes>
    </DataProvider>
  );
};

export default ProtectedRoutes;
