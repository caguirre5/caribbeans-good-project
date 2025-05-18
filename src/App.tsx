import './App.css'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/ICE/Landing'
import CoffeeProcess from './pages/ICE/CoffeeProcess'
import FAQs from './pages/ICE/FAQs'
import VRExperience from './pages/ICE/VRExp'
import ICE from './pages/ICE/ICE'
import ClientsForm from './pages/Forms/ClientsForm'
import Home from './pages/Main/Home'
import Contact from './pages/Main/Contact'
import About from './pages/Main/About'
import Ethos from './pages/Main/Ethos'
import Roasters from './pages/Main/Roasters'
import Subscribe from './pages/Main/Subscribe'
import Terms from './pages/Legal/termsPage'

import Login from './pages/Auth/Login'; // Importa las páginas de autenticación
import Signup from './pages/Auth/Signup';

import ProtectedRoutes from './ProtectedRoutes';
import { AuthProvider } from './contexts/AuthContext'; // Importa AuthProvider

import CookieConsentBanner from './pages/Legal/CookieConsentBanner'
import PdfViewer from './pages/Legal/PdfViewer'
// import Testing from './components/Testing'

function App() {

  return (
    <AuthProvider> {/* Envuelve todo en AuthProvider */}
      <div className='app-container overflow-x-hidden'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/Contact' element={<Contact />} />
          <Route path='/About' element={<About />} />
          <Route path='/Ethos' element={<Ethos />} />
          <Route path='/Roasters' element={<Roasters />} />
          <Route path='/Subscribe' element={<Subscribe />} />
          <Route path='/ICEHome' element={<Landing />} />
          <Route path='/ICE' element={<ICE />} />
          <Route path='/CoffeeProcess' element={<CoffeeProcess />} />
          <Route path='/FAQs' element={<FAQs />} />
          <Route path='/VRExperience' element={<VRExperience />} />
          <Route path='/Join' element={<ClientsForm />} />
          <Route path='/Legal/PrivacyPolicy' element={<Terms />} />
          <Route path='/Legal/IPTerms' element={<Terms />} />
          <Route path='/Legal/SalesTerms' element={<Terms />} />
          <Route path='/*' element={<ProtectedRoutes />} />
          <Route path='/login' element={<Login />} /> {/* Ruta de Login */}
          <Route path='/signup' element={<Signup />} /> {/* Ruta de Signup */}
          <Route path='/pdf-viewer' element={<PdfViewer />} />
          {/* <Route path='/testing-route' element={<Testing/>} /> */}
        </Routes>
        
        <CookieConsentBanner />
      </div>
    </AuthProvider>
  );
}

export default App;
