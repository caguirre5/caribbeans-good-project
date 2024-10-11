import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import backgroundPortal1 from '../../assets/Backgrounds/FondoMovil.png';
import backgroundPortal2 from '../../assets/Backgrounds/FondoDesk.png';

import TableListIcon from '../../assets/Icons/coffeechart1.svg';
import FolderOpenIcon from '../../assets/Icons/gallery2.svg';
import CartShoppingIcon from '../../assets/Icons/order2.svg';
import CommentsIcon from '../../assets/Icons/roastersforum2.svg';
import UserIcon from '../../assets/Icons/myaccount1.svg';
import GetInTouch from '../../assets/Icons/getintouch1.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const menuContent = [
  {
    icon: TableListIcon,
    id: "coffee-charts",
    title: "Coffee chart",
    description: "Have a look at what we have available in stock and place an order."
  },
  {
    icon: FolderOpenIcon,
    id: "resource-library",
    title: "Resource library",
    description: "Check out all the information and get access to photos and videos of the farms."
  },
  {
    icon: CartShoppingIcon,
    id: "place-order",
    title: "Order now",
    description: "Place your order with us, fuss free! We will get back to you within 24 hours."
  },
  {
    icon: CommentsIcon,
    id: "home",
    title: "Roasters forum",
    description: "A place to connect, share and learn from each other."
  },
  {
    icon: UserIcon,
    id: "my-account",
    title: "My account",
    description: "See all your personal information."
  },
  {
    icon: GetInTouch,
    id: "get-in-touch",
    title: "My Orders",
    description: "See all your orders"
  }
];

interface PortalProps {
  setActiveTab: (tab: string) => void;
}

const Portal: React.FC<PortalProps> = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const [background, setBackground] = useState(backgroundPortal1);

  // Actualiza el fondo cuando cambia el tamaño de la pantalla
  useEffect(() => {
    const updateBackground = () => {
      if (window.innerWidth >= 1024) {
        setBackground(backgroundPortal2); // Usar el fondo para escritorio
      } else {
        setBackground(backgroundPortal1); // Usar el fondo para móvil
      }
    };

    // Escucha el cambio de tamaño de la ventana
    window.addEventListener('resize', updateBackground);

    // Llama a la función inicialmente
    updateBackground();

    // Limpia el event listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('resize', updateBackground);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-[#044421] px-5 lg:px-0">
      <main
        className="w-full flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]"
        style={{
          backgroundImage: `url(${background})`, // Usa el estado para el fondo dinámico
          backgroundSize: 'contain',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <h2 className="text-2xl lg:text-3xl font-bold mb-0 text-center" style={{ fontFamily: "KingsThing" }}>
          Welcome to the
        </h2>
        <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-center" style={{ fontFamily: "KingsThing" }}>
          Roasters Portal
        </h1>
        <p className="text-sm text-center px-8 lg:px-0 mb-4 lg:mb-0 w-[260px]">
          We are delighted to welcome you to the brand new Roasters Portal! 
        </p>
        <FontAwesomeIcon icon={faChevronDown} className="hidden  text-[#a4cfc5] w-8 h-8 mt-40" />
      </main>

      <div className='hidden w-full h-20 bg-[#044421] '>

      </div>

      {/* Grid de los íconos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-h-screen lg:px-[15%] bg-white justify-items-center place-items-center content-center py-[10%] lg:gap-4 lg:p-10">
        {menuContent.map((card, index) => (
          <div
            key={index}
            className="lg:h-[350px] cursor-pointer flex flex-col items-center justify-center px-10 py-8 lg:py-4 text-center w-[90%] border border-none lg:w-[80%] rounded-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
            onClick={() => {
              if (card.id === "my-account") {
                navigate("/MyAccount");
              } else if (card.id === "get-in-touch"){
                navigate("/MyOrders");
              } 
              else {
                setActiveTab(card.id);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="flex justify-center mb-4">
              <img src={card.icon} alt={`${card.title} icon`} className="text-[#cf583a] w-20 h-20 lg:w-40 lg:h-40" />
            </div>
            <h3 className="text-md font-semibold mb-2">{card.title}</h3>
            <p className="text-sm">{card.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Portal;
