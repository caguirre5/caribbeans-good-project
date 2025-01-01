import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";
import RoastersBusiness from "../../components/RoastersBusinesses";
import CallbackForm from "../Forms/RoastersCallBackForm";

import Image1 from '../../assets/Images/All/Hunbatz-39.jpg';
import Image2 from '../../assets/Images/All/HAR07078.jpg';
import Image3 from '../../assets/Images/All/HAR07092.jpg';

import { IconButton, TextIconButton } from "../../components/Buttons";
import { useAuth } from '../../contexts/AuthContext'; // Importa el contexto de autenticación

const sections = [
    {
        title: "Based In Scotland",
        content: "We are the only green coffee importer based in Scotland, Glasgow to be exact. We offer our roasters fuss-free collection or shipping, avoiding extra charges."
    },
    {
        title: "30kg Bags",
        content: "At Caribbean Goods, we supply our green coffee in 30kg bags instead of the industry standard of 70kg. This is perfect for micro-lots and independents, allowing more flexibility and also a much easier time transporting!"
    },
    {
        title: "Easy Ordering",
        content: "Our new online ordering process has been designed to make it an easy process for our roasters. already a roaster with us? - check out the new online portal full of resources for you!"
    },
    {
        title: "No Minimum Order",
        content: "With us there is no minimum order, this has been a fundamental part of our business since beginning trading, we want to offer the finest quality coffee from Guatemala to roasters no matter the size or scale."
    },
    {
        title: "Reputation",
        content: "We are a multi award-winning enterprise, check out some of our achievements so far."
    },
    {
        title: "Social Impact",
        content: "We are a transparent, ethical green coffee importer. Read all about our ethics and the impact of the projects we have worked on.",
        href: "/About"
    }
];

const Roasters: React.FC = () => {
    const { currentUser } = useAuth(); // Verifica si el usuario está autenticado

    return (
        <div className="min-h-screen">
            <Header />
            <div className="bg-[#fcf9f4] flex flex-col items-center p-8 lg:flex-row lg:flex-wrap lg:justify-between lg:py-20 lg:px-[20%] pt-20 lg:pt-24 text-[#044421] pb-8">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 lg:w-full lg:text-center py-8" style={{ fontFamily: 'KingsThing' }}>
                    Working with Us
                </h1>
                {sections.map((section, index) => (
                    <div key={index} className="w-full mb-6 lg:w-1/3 lg:mb-0 lg:px-4">
                        <div className="flex flex-row mb-2">
                            <h2 className="text-xl font-bold mr-4" style={{ fontFamily: 'KingsThing' }}>{section.title}</h2>
                            {section.href && (
                                <IconButton route={'/Ethos'} />
                            )}
                        </div>
                        <p className="text-base">{section.content}</p>
                    </div>
                ))}
            </div>
            
            {/* Sección Actualizada */}
            <div className="flex flex-col lg:flex-row lg:min-h-screen">
                <div className="flex-1 bg-[#044421] h-auto">
                    <img src={Image2} alt="" className="w-full lg:h-full lg:w-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col py-20 lg:py-0 justify-center items-center bg-[#044421] text-[#9ed1c4]">
                    <h3 className="px-10 text-2xl lg:text-4xl text-center mb-8" style={{ fontFamily: 'KingsThing' }}>
                        Already a roaster working with us?
                    </h3>
                    <p className="mb-10 text-sm text-center font-bold w-[80%] lg:w-[40%]">
                                Access the new Roaster Portal to explore our latest stock, discover detailed farm information, and place your orders with ease.
                            </p>

                    {/* Verificación del estado de autenticación */}
                    {currentUser ? (
                        // Usuario autenticado
                        <>
                            <TextIconButton text="Go to Portal" color="#FAFAFA" textColor="#044421" route="/Portal" />
                        </>
                    ) : (
                        // Usuario no autenticado
                        <p className="text-center text-sm ">
                            <a href="/login" className="text-[#FAFAFA] hover:underline">Login</a> or <a href="/signup" className="text-[#FAFAFA] hover:underline">Sign Up</a> now to get started!
                        </p>
                    )}
                </div>
            </div>

            <RoastersBusiness />
            <div className="flex-1 bg-[#044421] h-auto lg:h-screen">
                <img src={Image3} alt="" className="w-full lg:h-full lg:w-full object-cover" />
            </div>
            <div className="flex flex-col lg:flex-row justify-center items-center py-12 bg-[#c9d3c0]">
                <div className="lg:w-[30%] lg:mr-10 order-1 flex flex-col justify-center items-center px-8">
                    <h3 className="text-xl font-bold text-[#044421] py-8">Sign up to Access our Roasters Portal</h3>
                    <p className="text-[#044421] pb-8">Our team will review the application and respond as soon as we can.</p>
                    <TextIconButton text="Sign Up Now" />
                </div>
                <img src={Image1} alt="" className="w-11/12 lg:w-[30%] rounded-full shadow-lg max-w-full h-auto object-cover mt-8 lg:ml-10 lg:order-2 order-0" />
            </div>
            <CallbackForm />
            <Footer />
        </div>
    );
};

export default Roasters;
