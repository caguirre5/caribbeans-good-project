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
                    <li><a className="text-[#044421]" href="/Ethos" onClick={() => redirectTo("/Ethos")}>Ethos</a></li>
                    <li><a className="text-[#044421]" href="/About" onClick={() => redirectTo("/About")}>About Us</a></li>
                    <li><a className="text-[#044421]" href="/Roasters" onClick={() => redirectTo("/Roasters")}>Roasters</a></li>
                    <li><a className="text-[#044421]" href="/Contact" onClick={() => redirectTo("/Contact")}>Contact</a></li>
                    <li><a className="text-[#044421]" href="/Subscribe" onClick={() => redirectTo("/Subscribe")}>Subscribe</a></li>
                    <li><a className="text-[#044421]" href="/ICE" onClick={() => redirectTo("/ICE")}>O</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Header;
