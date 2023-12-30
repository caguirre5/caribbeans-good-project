import './HeaderControls.css'
import Logo from '../assets/green_logo_icon.png'

function Header() {
    return (
        <div className="header-container">
            <div className='hc-section1'>Caribbean Goods</div>
            <div className='hc-section2'>
                <img src={Logo} alt="" />
            </div>
            <div className='hc-section3'>
                <ul className="nav-list">
                    <li><a href="/">Inicio</a></li>
                    <li><a href="/productos">Productos</a></li>
                    <li><a href="/servicios">Servicios</a></li>
                    <li><a href="/contacto">Contacto</a></li>
                    <li><a href="/contacto">Contacto</a></li>
                    <li><a href="/contacto">O</a></li>
                </ul>
            </div>
        </div>
    )
}

export default Header