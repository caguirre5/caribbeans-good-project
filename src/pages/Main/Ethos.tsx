import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"

import { getFirestore, doc, getDoc } from "firebase/firestore";



import { motion } from "framer-motion"

import image1 from "../../assets/Images/All/HAR07128.jpg"
import image2 from "../../assets/Images/All/HAR07100.jpg"
import image3 from "../../assets/Images/All/EFR05859.jpg"
import image4 from "../../assets/Images/All/EFR06884.jpg"

//Videos
import videoSrc from "../../assets/Videos/2A8A6990.mp4"

//Projects
import project1 from "../../assets/Images/All/MAIA_2023-73.jpg"
import project2 from "../../assets/Images/All/plantingtree.jpg"
// import project3 from "../../assets/Images/All/WAER TREATMENT FROM MILLING PROCESS.jpg"
// import project4 from "../../assets/Images/All/2de2d8186972333cb53304a542184cb5-cover-large.jpg"

//Logos
import logo1 from "../../assets/Images/Vectors/Logo/Treesforlifeuk.png"
import logo2 from "../../assets/Images/Vectors/Logo/MAIA_LOGO.png"

//Components
import SimpleContentSection from "../../components/SimpleContentSection"
// import { generateRandomBorderRadius } from "../../components/utilsFunctions"
import { TextIconButton } from "../../components/Buttons"
import { useEffect, useState } from "react"


const fadeInAnimationLeftVariants = {
    initial: {
        opacity:0,
        x:100,
    },
    animate: {
        opacity:1,
        x:0,
        transition: {
            duration: 1,
            delay: 0.1,
        },
    },
}

interface TreeData {
    trees: number;
    money: number;
}

function Ethos(){
    const defaultTreeData: TreeData = { trees: 0, money: 0 };

    const defaultMaiaData: number = 1050

    const [treeData, setTreeData] = useState<TreeData>(defaultTreeData);
    const [maiaData, setMaiaData] = useState<number>(defaultMaiaData);
    const [colegioData, setColegioData] = useState<number>(0);
    const [hunchouenData, setHunchouenData] = useState<number>(0);
    // const [othersData, setOthersData] = useState<number>(0);


    useEffect(() => {
        const fetchProjectsData = async () => {
            const db = getFirestore();
    
            // Planting Trees
            const plantingRef = doc(db, "projects", "planting-trees");
            const plantingSnap = await getDoc(plantingRef);
            if (plantingSnap.exists()) {
                const data = plantingSnap.data();
                setTreeData({
                    trees: Number(data.trees) || 0,
                    money: Number(data.money) || 0
                });
            }
    
            // MAIA
            const maiaRef = doc(db, "projects", "maia");
            const maiaSnap = await getDoc(maiaRef);
            if (maiaSnap.exists()) {
                setMaiaData(Number(maiaSnap.data().donations) || 0);
            }
    
            // Colegio
            const colegioRef = doc(db, "projects", "colegio");
            const colegioSnap = await getDoc(colegioRef);
            if (colegioSnap.exists()) {
                setColegioData(Number(colegioSnap.data().donations) || 0);
            }
    
            // Hunchouen
            const hunchRef = doc(db, "projects", "hunchouen");
            const hunchSnap = await getDoc(hunchRef);
            if (hunchSnap.exists()) {
                setHunchouenData(Number(hunchSnap.data().donations) || 0);
            }
    
            // Other Coffees
            // const otherRef = doc(db, "projects", "othercoffees");
            // const otherSnap = await getDoc(otherRef);
            // if (otherSnap.exists()) {
            //     setOthersData(Number(otherSnap.data().donations) || 0);
            // }
        };
    
        fetchProjectsData();
    }, []);
    

    return (
        <div className="bg-[#c9d3c0]">
            <Header/>
            <div className="mt-20 py-10 text-[#044421] bg-[#a6b09c] flex flex-col justify-center" style={{}}>
                <h1 className="text-center text-5xl" style={{fontFamily:'KingsThing'}}>Our Vision</h1>
                <p className="text-center">Our Ethos & Projects</p>
            </div>
            <div className="flex flex-col lg:flex-row min-h-screen">
                <div className="flex-1 flex flex-col py-20 lg:py-0 justify-center items-center bg-[#c9d3c0] text-[#044421]">
                    <h1 className="text-center text-5xl mb-8" style={{fontFamily:'KingsThing'}}>Our<br className="lg:hidden"/> Story</h1>
                    <motion.p className="px-10 lg:px-[18%] text-lg lg:text-xl mb-12" style={{fontFamily:'KingsThing'}}
                        variants={fadeInAnimationLeftVariants}
                        initial='initial'
                        whileInView='animate'
                        viewport={{
                            once:true,
                        }}
                    >
                        We've been fortunate to connect with most of our partner farmers, reaching around 80% of them. The remaining farmers within our network are small-scale producers located in Guatemala and they receive compensation through a collective system. 
                        <br/><br/>
                        This strategy allows us to cultivate strong bonds with our farming partners and ensures the establishment of secure and ethical labour practices for our farmers and employees. We hold these connections dear and are deeply dedicated to upholding sustainability and responsible business practices.
                    </motion.p>
                    <TextIconButton text="Learn more" blank="https://www.youtube.com/watch?v=2rOmUxFbNgA" />
                </div>
                <div className="flex-1 bg-[#a6b09c] h-auto">
                    <img src={image2} alt="" className="w-full h-auto lg:h-full lg:w-full object-cover" />
                </div>
            </div>
            <div className="bg-[#202719] px-10 lg:px-[25%] py-24" style={{fontFamily:"KingsThing"}}>
                <h2 className="text-2xl lg:text-4xl text-[#c9d3c0]">We envision a world where all the agricultural goods from the Latin-American region will be fairly sourced in a transparent supply chain with fair pay for the farmers who produce them.</h2>
                <h3 className="text-lg lg:text-2xl text-[#e6a318] py-8">At Caribbean Goods, making the world a better place is our mission. We started sourcing green coffee from Guatemala and plan to expand and source other agricultural goods in the region shortly.</h3>
                <h2 className="text-2xl lg:text-4xl text-[#c9d3c0]">Caribbean Goods was founded to create a better life and work environment for people who work in the fields, their families, and their communities. </h2>
            </div>
            <div className="bg-[#628f76] px-10 py-24 flex flex-col justify-center items-center   lg:flex-row">
                <div className="lg:w-[35%] lg:mr-8">
                    <h1 className="text-left text-5xl text-[#c9d3c0] mb-8" style={{fontFamily:'KingsThing'}}>
                        Our Ethos
                    </h1>
                    <p className="text-[#c9d3c0]">
                        Our Founder, Javier, is from Guatemala; he saw mass corruption, violence, and challenging economic situations for the people in the region. We have a duty to the hard-working farmers we work with. We do whatever we can to improve their lives and beneficially impact their communities.
                    <br/><br/>
                        We have a strong mission deeply rooted in customer service, empowerment, and quality. More than a company; we are a force for change. Join us as we empower farmers, reshape markets, and lead the way in the coffee industry's future.
                    <br/><br/>
                        We have three core areas we focus on in terms of improving the agricultural goods industry:
                    </p>
                </div>
                <div className="bg-[#38694e] w-11/12 lg:w-4/12 mx-2 mt-8 p-8 text-[#df9a87] lg:ml-8" style={{fontFamily:'KingsThing'}}>
                    <p className="text-left text-2xl lg:text-4xl my-4">1. Customer Service</p>
                    <p className="text-center text-2xl lg:text-4xl my-4">2. Empowerment</p>
                    <p className="text-right text-2xl lg:text-4xl my-4">3. Quality</p>
                </div>
            </div>
            <SimpleContentSection
                title='Customer Service'
                text={[
                    "At Caribbean Goods, our customers are the heart of our business. We deeply care about your satisfaction and well-being. We are committed to providing you with the highest level of service, tailored solutions, and transparent communication.",
                    "We're here to listen, assist, and ensure your experience with us is exceptional."
                ]}
                image={image1}
                backgroundColor="#38694e"
                textColor="#c9d3c0"
            />
            <SimpleContentSection
                title='Empowerment'
                text={[
                    "We are not just about business; we are about enabling change. We are committed to rewriting the scripts of agricultural commerce in Latin America. By forging a direct link between farmers and the UK, we empower these individuals, ensuring fair remuneration and brighter prospects.",
                    "Our belief is simple: true transformation happens when people unite. By choosing Caribbean Goods, you're not just supporting a business but joining a movement for positive change. We can create a more equitable, eco-conscious future that benefits us all."
                ]}
                image={image3}
                backgroundColor="#e6a318"
                textColor="#044421"
                reverseOrder
            />
            <SimpleContentSection
                title='Quality'
                text={[
                    "Our coffee beans from Guatemala represent the pinnacle of quality. Our beans are nurtured by the ideal climate and volcanic soil, resulting in a cup of coffee that is truly exceptional.",
                    "Each bean is handpicked, sun dried, and carefully filtered ensuring that only the finest coffee cherries make it into your cup. Our commitment to sustainability means that we support local farmers who employ eco-friendly cultivation methods.",
                    "With each sip, you'll experience the unique taste of this region's terroir, a true testament to the artistry of coffee."
                ]}
                image={image4}
                backgroundColor="#8ab49d"
                textColor="#ffffff"
                titleColor="#044421"
            />
            <div className="bg-[#fcf9f4]  px-8 py-20 flex flex-col justify-center items-center">
                <h1 className="text-5xl lg:text-8xl text-[#044421]" style={{fontFamily:'KingsThing'}}>Social Impact</h1>


                <div className="flex flex-col  justify-center items-center py-12">
                    <div className="flex flex-col lg:flex-row items-center justify-center ">
                        <div className="lg:w-[30%] flex flex-col justify-center items-center lg:items-start lg:mr-10 order-1 lg:order-0 ">
                            <a  target="_blank" href="https://www.maiaimpact.org/"><img src={logo2} alt="" className="lg:w-[80%]"/></a>
                            {/* <h3 className="text-xl font-bold text-[#044421] py-8">Planting Trees in Scotland</h3> */}

                            <div className="my-4 text-[#044421] ">
                                {/* <h4 className="text-2xl font-normal">
                                    <span className="font-semibold">{treeData.trees}</span> Trees in this grove
                                </h4> */}
                                <h4 className="text-xl lg:text-2xl text-center lg:text-start font-bold">
                                    We have donated $<span className="font-semibold">{maiaData.toFixed(2)}</span> USD to MAIA since October 2024 — and counting!. This support comes from three main streams:
                                </h4>
                            </div>
                        </div>
                        {/* style={{ borderRadius: generateRandomBorderRadius() }} */}
                        <img src={project1} alt="" className="w-11/12 lg:w-[30%] rounded-lg shadow-lg max-w-full h-auto object-cover lg:order-1 order-0 mb-6 lg:mb-0 "/>
                    </div>

                    <div className="lg:w-[62%] flex flex-col justify-center items-start mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-[#044421]">
                            <div className="bg-[#c9d3c0] p-6 pt-10 shadow-lg rounded-xl">
                                <p className="text-[#e6a318] font-bold text-lg mb-1">01.</p>
                                <h3 className="font-semibold mb-1 text-lg">El Colegio Sales</h3>
                                <p>Exclusive partnership between <a target="_blank" href="https://www.thomsonscoffee.com/" className="hover:underline">Thomsons</a> and Caribbean Goods, where £<span className="font-semibold">{colegioData.toFixed(2)}</span> per kg goes to MAIA.</p>
                            </div>
                            <div className="bg-[#c9d3c0] p-6 pt-10 shadow-lg rounded-xl">
                                <p className="text-[#e6a318] font-bold text-lg mb-1">02.</p>
                                <h3 className="font-semibold mb-1 text-lg">Hunchouen Sales</h3>
                                <p>Used by multiple roasters, also generating £<span className="font-semibold">{hunchouenData.toFixed(2)}</span> per kg in donations.</p>
                            </div>
                            <div className="bg-[#c9d3c0] p-6 pt-10 shadow-lg rounded-xl">
                                <p className="text-[#e6a318] font-bold text-lg mb-1">03.</p>
                                <h3 className="font-semibold mb-1 text-lg">Other Coffees</h3>
                                <p>Roasters who love MAIA donate through us, even if the coffee isn’t tied to a specific program.</p>
                            </div>
                        </div>

                        <p className="text-[#044421] mb-8">
                            As a reference, $7.50 provides 5 meals to a Girl Pioneer at MAIA. With our total donations, we’ve helped fund approximately 
                            <span className="font-semibold"> {(Number(maiaData) / 7.5 * 5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> meals — nourishing futures one cup at a time.
                            <br/><br/>
                            We believe that with quality education as a tool against adversity, these bold trailblazers will reshape their futures, uplift their communities, and create a better world for all of us. MAIA’s flagship program, the MAIA Impact School, is changing the game for education in Guatemala. We call their students Girl Pioneers, because many are the first in their families to pursue an education and break the cycle of generational poverty.
                        </p>

                        <TextIconButton text="See the project" blank="https://www.youtube.com/watch?v=BC914v2rtU8" />
                    </div>

                </div>
                <div className="flex flex-col lg:flex-row justify-center items-center py-12">
                    <div className="lg:w-[30%] lg:mr-10 order-1">
                        <a href="https://treesforlife.org.uk/groves/474546/" target="_blank"><img src={logo1} alt="" className=""/></a>
                        <h3 className="text-xl font-bold text-[#044421] py-8">Planting Trees in Scotland</h3>

                        <div className="my-4 text-[#044421]">
                            <h4 className="text-2xl font-normal">
                                <span className="font-semibold">{treeData.trees}</span> Trees in this grove
                            </h4>
                            {/* <h4 className="text-xl font-normal">
                                £<span className="font-semibold">{treeData.money.toFixed(2)}</span> In donations
                            </h4> */}
                        </div>

                        <p className="text-[#044421] mb-8">Pilgrims Coffee is a Coffee house and Roastery based on Holy Island, a small tidal island off the coast of Northumbria. We donated 350 kg of green coffee to them with one ask to do something great for the planet. They returned and told us our donation helped them plant 200 trees in the Scottish highland through the fantastic charity, Trees for Life! You can check out the change already made and even get involved and donate your tree! Trees For Life UK is a charity committed to rewilding the Scottish highlands.</p>
                        <TextIconButton text="See the grove" blank="https://treesforlife.org.uk/groves/474546/"/>
                    </div>
                    <img src={project2} alt="" className="w-11/12 lg:w-[30%] rounded-lg shadow-lg max-w-full h-auto object-cover mt-8 lg:ml-10 order-0 lg:order-2" />
                </div>

                {/* <div className="flex flex-col lg:flex-row justify-center items-center py-12">
                    <div className="lg:w-[30%] lg:ml-10 order-1">
                        <h3 className="text-xl font-bold text-[#044421] py-8">Small steps, Big Differences </h3>
                        <p className="text-[#044421]">One of our farms, Finca Medina, reuses 100% of the water needed to process the coffee beans, so they don't waste a drop! Now, if that's not an inspiration to us all, we don't know what is! </p>
                    </div>
                    <img src={project3} alt="" className="w-11/12 lg:w-[30%] rounded-lg shadow-lg max-w-full h-auto object-cover mt-8 lg:mr-10 order-0" style={{ borderRadius: generateRandomBorderRadius() }}/>
                </div> */}
                {/* <div className="flex flex-col lg:flex-row justify-center items-center py-12">
                    <div className="lg:w-[30%] lg:mr-10 order-1">
                        <img src={logo2} alt="" className="h-[50px] mt-8 lg:mt-0"/>
                        <h3 className="text-xl font-bold text-[#044421] py-8">Helping Where We Can</h3>
                        <p className="text-[#044421]">Caribbean Goods partnered with Forth Coffee,  and together we donated 350kg of coffee to Social Bite, a charity and social business providing homes, jobs, food, and support to empower people to transform their own lives. dedicated to the mission of ending homelessness in Scotland.</p>
                        <a href="">Read more about their fantastic work here</a>
                    </div>
                    <img src={project4} alt="" className="w-11/12 lg:w-[30%] rounded-lg shadow-lg max-w-full h-auto object-cover mt-8 lg:ml-10 order-0 lg:order-2" style={{ borderRadius: generateRandomBorderRadius() }}/>
                </div> */}
            </div>
            <div className="w-full h-[75vh] overflow-hidden relative pointer-events-none">
                <video className="w-full h-full object-cover " src={videoSrc} autoPlay muted loop playsInline/>
            </div>
            <Footer/>
        </div>
    )
}

export default Ethos