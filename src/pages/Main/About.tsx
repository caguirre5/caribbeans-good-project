import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"

import Roasters from "../../components/RoastersBusinesses"

//Images
import image1 from "../../assets/Images/All/2A8A6795.jpg"

import videoSrc from "../../assets/Videos/Corporativa Acatenango.mp4"

import imageCircle1 from "../../assets/Images/All/Medina-39.jpg"
import imageCircle2 from "../../assets/Images/All/Medina-28 - Copy.jpg"

import TeamCarousel from "../../components/TeamCarousel"

import TeamCard from "../../components/TeamCard"

import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";


// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

function About() {
    const [teamMembers, setTeamMembers] = useState<{ name: string; position: string; image: string; }[]>([]);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const db = getFirestore();
                const teamCollection = collection(db, "teamMembers");
                const teamQuery = query(teamCollection, orderBy("order", "asc"));

                const snapshot = await getDocs(teamQuery);
                const members = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        name: data.name || "Unnamed",
                        position: data.position || "Position",
                        image: data.photoUrl || "", // asegúrate que sea el campo correcto
                    };
                });
                setTeamMembers(members);
            } catch (error) {
                console.error("Error fetching team members:", error);
            }
        };

        fetchTeamMembers();
    }, []);


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
                <div className="hidden lg:flex flex-wrap justify-center w-full lg:w-[60%] mx-auto">
                    {teamMembers.map((member, index) => (
                        <div className="w-full lg:w-1/3 p-4" key={index}> {/* Cambiar lg:w-1/4 por lg:w-1/3 */}
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

{/* 
            <section className="bg-white py-16">
                <div className="max-w-4xl mx-auto px-8 text-center">
                    {/* <h2 className="text-3xl font-semibold mb-6">Client Testimonial</h2> 
                    
                    <div className="relative bg-white  rounded-lg lg:p-6">
                    <p className="text-lg italic text-[#044421]">
                        "Working with Javier and the Caribbean Goods team has really shone a light for me on what a healthy trade relationship looks like. No request is too big or too small, the quality of coffee is always excellent, the business support through marketing materials and storytelling is available and it's evident just by talking to Javier that his passion and enthusiasm for Guatemalan produce and community is unmatched. This is a relationship that we hope to maintain to its fullest for a long time - I wholeheartedly recommend Caribbean Goods for any and all Guatemalan coffee production."
                    </p>

                    <div className="mt-4">
                        <p className="text-[#044421] font-semibold">Ben Rowe, Harmony Coffee</p>
                    </div>
                    
                    <div className="mt-6">
                        <a 
                        
                        href="https://www.harmonycoffee.co.uk/" 
                        target="_blank"
                        className="inline-flex items-center text-[#9ed1c4] font-semibold hover:underline"
                        >
                        Learn more
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-5 w-5 ml-4" />
                        </a>
                    </div>
                    </div>
                </div>
            </section> */}


            <Roasters/>
            
            <div className="w-full h-[640px] overflow-hidden relative pointer-events-none">
                <video className="w-full h-full object-cover " src={videoSrc} autoPlay muted loop playsInline/>
            </div>
            
            <Footer/>
        </div>
    )
}

export default About