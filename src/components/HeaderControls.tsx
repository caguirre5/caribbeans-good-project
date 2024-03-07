import './HeaderControls.css'
import Logo from '../assets/green_logo_icon.png'

import { useNavigate } from 'react-router-dom'

function Header() {
    const navigate = useNavigate();

    const redirectTo = (route: string) => {
        navigate(route); 
    };

    return (
        <div className="header-container">
            <div className='hc-section1'>Caribbean Goods</div>
            <div className='hc-section2'>
                <img src={Logo} alt="" onClick={() => redirectTo('/ICE_Members')}/>
            </div>
            <div className='hc-section3'>
                <ul className="nav-list">
                    <li><a href="/ICE">Inicio</a></li>
                    <li><a href="/ICE">Productos</a></li>
                    <li><a href="/ICE">Servicios</a></li>
                    <li><a href="/ICE">Contacto</a></li>
                    <li><a href="/ICE">Contacto</a></li>
                    <li><a href="/ICE">O</a></li>
                </ul>
            </div>
        </div>
    )
}

export default Header