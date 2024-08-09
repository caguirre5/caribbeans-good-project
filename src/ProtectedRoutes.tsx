import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PortalHome from './pages/Portal/Home';
import Profile from './components/Profile';
import { useAuth0 } from '@auth0/auth0-react';
import { DataProvider } from './contexts/Datacontent';

const ProtectedRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
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
