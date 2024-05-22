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

function App() {

  return (
    <div className='app-container'>
      <Routes>
        <Route path='/Home' element={<Home/>}/>
        <Route path='/Contact' element={<Contact/>}/>
        <Route path='/About' element={<About/>}/>
        <Route path='/Ethos' element={<Ethos/>}></Route>
        <Route path='/Roasters' element={<Roasters/>} />
        <Route path='/Subscribe' element={<Subscribe/>} />
        <Route path='/' element={<Landing/>}/>
        <Route path='/ICE' element={<ICE/>}/>
        <Route path='/CoffeeProcess' element={<CoffeeProcess/>}/>
        <Route path='/FAQs' element={<FAQs/>}/>
        <Route path='/VRExperience' element={<VRExperience/>}/>
        <Route path='/Join' element={<ClientsForm/>}></Route>
      </Routes>
    </div>
  )
}

export default App
