import { useState } from 'react';
import Logo from '../assets/green_logo_icon.png';
import { To, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const MenuButton = (props:any) => {
    const {label, onClick} = props
    return (
        <button
            onClick={onClick}
            className='text-2xl font-bold cursor-pointer hover:text-indigo-600 transition-colors'    
        >
            {label}
        </button>
    )
}

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
                <img src={Logo} alt="" className="lg:hidden  h-10 cursor-pointer" onClick={() => redirectTo("/Home")} />
                <p className="text-xl font-bold " onClick={() => redirectTo("/Home")}>Caribbean Goods</p>
            </div>
            <div className="lg:flex items-center justify-center hidden">
                <img src={Logo} alt="" className="lg:h-20 cursor-pointer" onClick={() => redirectTo("/Home")} />
            </div>
            <div className={`flex lg:flex-1 lg:flex items-center justify-end`}>
                <FontAwesomeIcon 
                    className="flex lg:hidden h-8 cursor-pointer z-50" 
                    icon={menuOpen ? faTimes : faBars} 
                    onClick={() => setMenuOpen(!menuOpen)} 
                />
                
                <ul className={`fixed top-0 right-0 w-4/5 h-full bg-white flex flex-col items-center justify-center transition-transform transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:flex-row lg:bg-transparent lg:translate-x-0 lg:h-auto lg:w-auto`}>

                    <li className="my-5 lg:mr-5 last:mr-0"><a className="text-[#044421] hover:text-[#e99c18]" href="/Ethos" onClick={() => redirectTo("/Ethos")}>Ethos</a></li>
                    <li className="my-5 lg:mr-5 last:mr-0"><a className="text-[#044421] hover:text-[#e99c18]" href="/About" onClick={() => redirectTo("/About")}>About Us</a></li>
                    <li className="my-5 lg:mr-5 last:mr-0"><a className="text-[#044421] hover:text-[#e99c18]" href="/Roasters" onClick={() => redirectTo("/Roasters")}>Roasters</a></li>
                    <li className="my-5 lg:mr-5 last:mr-0"><a className="text-[#044421] hover:text-[#e99c18]" href="/Contact" onClick={() => redirectTo("/Contact")}>Contact</a></li>
                    <li className="my-5 lg:mr-5 last:mr-0"><a className="text-[#044421] hover:text-[#e99c18]" href="/Subscribe" onClick={() => redirectTo("/Subscribe")}>Subscribe</a></li>
                    <li className="my-5 lg:mr-5 last:mr-0"><a className="w-[40px] h-[40px] rounded-full bg-[#044421] flex items-center justify-center text-white" href="/ICE" onClick={() => redirectTo("/ICE")}>O</a></li>
                </ul>
            </div>
        </div>
    );
}

export default Header;
