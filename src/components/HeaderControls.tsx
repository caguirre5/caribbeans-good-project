import React, { useState } from 'react';
import './HeaderControls.css';
import Logo from '../assets/green_logo_icon.png';
import { useNavigate } from 'react-router-dom';

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const redirectTo = (route) => {
        navigate(route); 
        setMenuOpen(false); // Cerrar el menú después de hacer clic en un enlace
    };

    return (
        <div className="header-container">
            <div className='hc-section1'>Caribbean Goods</div>
            <div className='hc-section2'>
                <img src={Logo} alt="" onClick={() => redirectTo('/ICE_Members')}/>
            </div>
            <div className={`hc-section3 ${menuOpen ? 'open' : ''}`}>
                <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>Menú</button>
                <ul className={`nav-list ${menuOpen ? 'open' : ''}`}>
                    <li><a href="/ICE" onClick={() => redirectTo('/ICE')}>Inicio</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo('/ICE')}>Productos</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo('/ICE')}>Servicios</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo('/ICE')}>Contacto</a></li>
                    <li><a href="/ICE" onClick={() => redirectTo('/ICE')}>O</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Header;
