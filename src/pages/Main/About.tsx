import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"

import Roasters from "../../components/RoastersBusinesses"

//Images
import image1 from "../../assets/Images/All/2A8A6795.jpg"

import videoSrc from "../../assets/Videos/Corporativa Acatenango.mp4"

import imageCircle1 from "../../assets/Images/All/Medina-39.jpg"
import imageCircle2 from "../../assets/Images/All/Medina-28 - Copy.jpg"

import TeamCarousel from "../../components/TeamCarousel"

import teamMJavier from "../../assets/TeamMembers/Javier.jpg"
import teamMMaurice from "../../assets/TeamMembers/Maurice.jpg"
import teamMAlice from "../../assets/TeamMembers/Alice.jpg"
import teamMBruce from "../../assets/TeamMembers/Bruce.jpg"

import TeamCard from "../../components/TeamCard"

function About() {
    const teamMembers = [
        { name: 'Javier Gutierrez', position: 'Founder & CEO', image: teamMJavier },
        { name: 'Mr. Maurice Taylor', position: 'OBE Advisory Board', image:teamMMaurice },
        { name: 'Bruce Lean', position: 'Consultant', image:teamMBruce },
        { name: 'Harold', position: 'Photographer', image:teamMJavier },
        { name: 'Cristian Aguirre', position: 'Web Developer', image: teamMJavier },
        { name: 'Efren', position: 'Videographer', image:teamMJavier },
        { name: 'Alice Brown', position: 'Illustrator', image:teamMAlice },
        // Añadir más miembros del equipo aquí...
      ];

    return (
        <div>
            <Header/>
            <div className="w-full min-h-[100vh] flex flex-col justify-center items-center bg-[#cad4c4] pt-20 pb-24  px-10 lg:px-[25%]">
                <div className="w-[200px] lg:w-[300px] h-[200px] lg:h-[300px] rounded-full">
                    <img src={imageCircle2} alt="" className="w-full h-full object-cover rounded-full"/>
                </div>
                <h1 className="text-[#044421] text-5xl text-center font-light py-10" style={{fontFamily:'KingsThing'}}>About us</h1>
                <hr className="w-9 bg-[#044421] h-1"/>
                <h3 className="text-[#779da0] text-xl text-center py-5">Ethical Green Coffee Importer </h3>
                <p className="text-sm text-[#044421]">Welcome to Caribbean Goods, where we specialise in importing green coffee to the UK. Our primary goal is to promote completely transparent trading, ensuring truly ethical coffee. We achieve this by sourcing our coffee directly from farmers we have personally met, which allows us to circumvent the industry issues that many farmers face and provide them with the fair work and pay they deserve. Our commitment to quality means we supply only the finest green coffee beans to roasters throughout the UK.</p>
            </div>
            <div className="w-full min-h-[100vh] flex flex-col justify-around items-center bg-[#fcf9f4] py-20 px-10">
                <h1 className="text-[#044421] text-5xl font-light mb-10" style={{fontFamily:'KingsThing'}}>Meet Our Team</h1>
                <div className="hidden lg:flex flex-wrap justify-center w-full lg:w-[80%] mx-auto">
                    {teamMembers.map((member, index) => (
                        <div className="w-full lg:w-1/4 p-4" key={index}>
                        <TeamCard
                            name={member.name}
                            position={member.position}
                            image={member.image}
                        />
                        </div>
                    ))}
                </div>
                <div className="flex lg:hidden">
                    <TeamCarousel members={teamMembers} />
                </div>
                    
            </div>
            <div className="w-full overflow-hidden h-[30vh] lg:h-[50vh]" style={{height:'50vh'}}>
                <img src={image1}
                alt="Landscape"
                className="w-full h-full object-cover"
                />
            </div>
            <div className="w-full flex flex-col justify-center items-center bg-[#cad4c4] py-20 px-10 lg:px-[30%]" >
                <div className="w-[200px] lg:w-[300px] h-[200px] lg:h-[300px] rounded-full">
                    <img src={imageCircle1} alt="" className="w-full h-full object-cover rounded-full"/>
                </div>
                <h1 className="text-[#044421] text-5xl font-light text-center py-10" style={{fontFamily:'KingsThing'}}>Our Story</h1>
                <hr className="w-9 bg-[#044421] h-1"/>
                <h3 className="text-[#779da0] text-xl text-center py-5">Where It All Began</h3>
                <p className="text-sm text-[#044421]">Caribbean Goods was founded with the dream of making coffee farming in Guatemala fair for the hardworking farmers who produce it. The founder, Javier, was born and raised in Guatemala and went to school with some of the farmers we buy our coffee from.<br/> <br/>Javier Gutiérrez Abril grew up in Guatemala City, where he witnessed poverty, extreme violence, and a lack of educational opportunities from a very young age. He volunteered for several movements that aimed to make the world a better place, such as Techo para mi Pais and Soñar Despierto. During his bachelor's degree, he also found time to support orphaned children at Casa Bernabé.<br/><br/> Javier's life experiences inspired him to become an activist for a better world. He believes that education is the key to a successful future and understands the importance of a sustainable world. Therefore, he focuses his time and effort on contributing to a greener world and promoting education for everyone, everywhere. After obtaining a bachelor's degree in Engineering from Universidad del Valle de Guatemala, he left for Scotland in 2017. He then got another degree in Finance from Strathclyde University, and Caribbean Goods was born.</p>
                <h3 className="text-xl text-[#044421] mt-8" style={{fontFamily:'KingsThing'}}>‘I consider myself an activist working towards a greener and more educated world. I believe I came to this world to cause a positive impact on the people I meet, and in the meantime, I am selling goods from the Caribbean region ‘ - Javier</h3>
            </div>
            <Roasters/>
            
            <div className="w-full h-[640px] overflow-hidden relative">
                <video className="w-full h-full object-cover " src={videoSrc} autoPlay muted loop />
            </div>
            
            <Footer/>
        </div>
    )
}

export default About