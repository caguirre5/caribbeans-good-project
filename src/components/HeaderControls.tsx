import { useState } from 'react';
import Logo from '../assets/green_logo_icon.png';
import { To, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    
    const navigate = useNavigate();

    const redirectTo = (route: To) => {
        navigate(route);
        setMenuOpen(false); // Cerrar el menú después de hacer clic en un enlace
    };

    return (
        <div className="absolute w-full flex justify-between items-center px-4 lg:px-12">
            <div className="flex lg:flex-1 items-center lg:justify-start h-20">
                <img src={Logo} alt="" className="lg:hidden  h-10 cursor-pointer" onClick={() => redirectTo("/")} />
                <p className="text-xl text-[#044421] font-bold cursor-pointer" onClick={() => redirectTo("/")}>Caribbean Goods</p>
            </div>
            <div className="lg:flex items-center justify-center hidden">
                <img src={Logo} alt="" className="lg:h-20 cursor-pointer" onClick={() => redirectTo("/")} />
            </div>
            <div className={`flex lg:flex-1 lg:flex items-center justify-end`}>
                <FontAwesomeIcon 
                    className="flex lg:hidden h-8 cursor-pointer z-50" 
                    icon={menuOpen ? faTimes : faBars} 
                    onClick={() => setMenuOpen(!menuOpen)} 
                />
                
                <ul className={`text-[#044421] text-[0.8rem] fixed top-0 right-0 w-4/5 h-full bg-white flex flex-col items-center justify-center transition-transform transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:flex-row lg:bg-transparent lg:translate-x-0 lg:h-auto lg:w-auto`}>

                    <li className="my-5 lg:mr-8 last:mr-0"><a className="font-semibold hover:text-[#e99c18]" href="/Ethos" onClick={() => redirectTo("/Ethos")}>Ethos</a></li>
                    <li className="my-5 lg:mr-8 last:mr-0"><a className="font-semibold hover:text-[#e99c18]" href="/About" onClick={() => redirectTo("/About")}>About Us</a></li>
                    <li className="my-5 lg:mr-8 last:mr-0"><a className="font-semibold hover:text-[#e99c18]" href="/Roasters" onClick={() => redirectTo("/Roasters")}>Roasters</a></li>
                    <li className="my-5 lg:mr-8 last:mr-0"><a className="font-semibold hover:text-[#e99c18]" href="/Contact" onClick={() => redirectTo("/Contact")}>Contact</a></li>
                    <li className="my-5 lg:mr-8 last:mr-0"><a className="font-semibold hover:text-[#e99c18]" href="/Subscribe" onClick={() => redirectTo("/Subscribe")}>Subscribe</a></li>
                    <li className="my-5 lg:mr-8 last:mr-0"><a className="font-semibold hover:text-[#e99c18]" href="/ICEHome" onClick={() => redirectTo("/ICEHome")}>ICX</a></li>
                    <li className="my-5 lg:mr-8 last:mr-0"><a className="w-[40px] h-[40px] rounded-full bg-[#044421] flex items-center justify-center text-white" href="/ICE" onClick={() => redirectTo("/ICE")}>O</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Header;
