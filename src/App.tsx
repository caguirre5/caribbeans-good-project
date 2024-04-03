import './App.css'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/ICE/Landing'
import CoffeeProcess from './pages/ICE/CoffeeProcess'
import FAQs from './pages/ICE/FAQs'
import VRExperience from './pages/ICE/VRExp'
import ICE from './pages/ICE/ICE'
import ClientsForm from './pages/Forms/ClientsForm'


function App() {

  return (
    <div className='app-container'>
      <Routes>
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
