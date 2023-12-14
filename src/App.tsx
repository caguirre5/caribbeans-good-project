import './App.css'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/ICE/Landing'


function App() {

  return (
    <div className='app-container'>
      <Routes>
        <Route path='/ICE_Members' element={<Landing/>}/>
        <Route path='' element=''/>
        <Route path='' element=''/>
        <Route path='' element=''/>
      </Routes>
    </div>
  )
}

export default App
