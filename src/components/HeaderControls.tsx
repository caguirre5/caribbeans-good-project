import { useState } from 'react';
import './HeaderControls.css';
import Logo from '../assets/green_logo_icon.png';
import { To, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const redirectTo = (route: To) => {
        navigate(route); 
        setMenuOpen(false); // Cerrar el menú después de hacer clic en un enlace
    };

    return (
        <div className="header-container">
            <div className='hc-section1'>
                <img src={Logo} alt="" onClick={() => redirectTo("/ICE")}/>
                <p>Caribbean Goods</p>
            </div>
            <div className='hc-section2'>
                <img src={Logo} alt="" onClick={() => redirectTo("/ICE")}/>
            </div>
            <div className={`hc-section3 ${menuOpen ? 'open' : ''}`}>
                <FontAwesomeIcon className="menu-toggle" icon={faBars} onClick={() => setMenuOpen(!menuOpen)}/>
                <ul className={`nav-list ${menuOpen ? 'open' : ''}`}>
                    <li><a href="/ICE" onClick={() => redirectTo("/ICE")}>Inicio</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo("/ICE")}>Productos</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo("/ICE")}>Servicios</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo("/ICE")}>Contacto</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo("/ICE")}>O</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Header;
