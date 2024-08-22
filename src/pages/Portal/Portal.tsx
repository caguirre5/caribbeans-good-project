import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMugHot, faFolderOpen, faCartShopping, faComments, faTableList, faChevronDown, faUser } from '@fortawesome/free-solid-svg-icons';
import backgroundPortal from '../../assets/Backgrounds/Background-Portal.jpg'
import { useNavigate } from 'react-router-dom';

const menuContent = [
  {
    icon:faTableList,
    id:"coffee-charts",
    title:"Coffee chart",
    description:"Have a look at what we have available in stock and place an order."
  },
  {
    icon:faFolderOpen,
    id:"resource-library",
    title:"Resource library",
    description:"Check out all the information and get access to photos and videos of the farms."
  },
  {
    icon:faCartShopping,
    id:"place-order",
    title:"Order now",
    description:"Place your order with us, fuss free! We will get back to you within 24 hours."
  },
  {
    icon:faComments,
    id:"home",
    title:"Roasters forum",
    description:"A place to connect, share and learn from each other."
  },
  {
    icon:faUser,
    id:"my-account",
    title:"My Account",
    description:"See all your personal information."
  }
]

interface PortalProps {
  setActiveTab: (tab: string) => void;
}

const Portal: React.FC<PortalProps> = ({setActiveTab}) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className='flex flex-col items-center justify-center text-[#044421] px-5 lg:px-0'
    >
      <main 
        className=' w-full flex flex-col justify-center items-center'
        style={{
          height:'calc(100vh - 10rem)',
          backgroundImage: `url(${backgroundPortal})`, backgroundSize: 'contain', backgroundPosition: 'center top', backgroundRepeat:'no-repeat'
        }}
      >
        <h2 className="text-2xl lg:text-3xl font-bold mb-0 text-center" style={{fontFamily:"KingsThing"}}>Welcome to the</h2>
        <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-center" style={{fontFamily:"KingsThing"}}>Roasters Portal</h1>
        <p className='text-sm text-center px-8 lg:px-0 mb-4 lg:mb-0 w-[260px]'>We are delighted to welcome you to the brand new Roasters Portal! </p>
        <FontAwesomeIcon icon={faChevronDown} className="text-[#a4cfc5] w-8 h-8 mt-40" />
      </main>
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full h-screen lg:px-[15%] bg-white justify-items-center content-center py-[10%] lg:gap-4 lg:p-10">
        {menuContent.map((card, index) => (
          <div 
            key={index} 
            className="h-[250px] cursor-pointer flex flex-col items-center justify-center p-2 py-4 lg:p-6 text-center w-[90%] border border-none lg:w-[80%] rounded-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
            onClick={() => {
              if (card.id === "my-account") {
                navigate("/MyAccount");
              } else {
                setActiveTab(card.id);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="flex justify-center mb-4">
              <FontAwesomeIcon icon={card.icon} className="text-[#cf583a] w-10 h-10" />
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

