import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"

import ImageCarousel from "../../components/Carrousel"
import ImageCard from "../../components/ImageArchCard"

import { useMediaQuery } from 'usehooks-ts'
import { motion } from "framer-motion"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import { TextWButton, TextIconButton } from "../../components/Buttons"
import SocialMedia from "../../components/SocialMedia";

import vector1farmer from '../../assets/Images/Vectors/vector1-farmers.png'
import vector2farmer from '../../assets/Images/Vectors/vector2-farmers.png'
import vector3farmer from '../../assets/Images/Vectors/vector3-farmers.png'

import Roasters from "../../components/RoastersBusinesses";

import roaster1 from '../../assets/Images/Vectors/Logo/roasters-fower.png'
import roaster2 from '../../assets/Images/Vectors/Logo/roasters-thomsons.png'
import roaster3 from '../../assets/Images/Vectors/Logo/roasters-brew.png'

import image1Form from '../../assets/Images/Places/image-form1.jpg'
import image2Form from '../../assets/Images/All/1.jpg'

import image1 from "../../assets/Images/All/HAR07128.jpg"
import image2 from "../../assets/Images/All/2A8A7136.jpg"
import image3 from "../../assets/Images/All/Hunbatz-34.jpg"


import imageCarousel1 from "../../assets/Images/Carousels/EFR06209.jpg"
import imageCarousel2 from "../../assets/Images/Carousels/EFR06251.jpg"
import imageCarousel3 from "../../assets/Images/Carousels/EFR06273.jpg"
import imageCarousel4 from "../../assets/Images/Carousels/EFR06394.jpg"

import background from "../../assets/Backgrounds/MainHome-WhiteBackground.jpg"

// import { fadeInAnimationVariants } from "../../components/variantsGallery"

import './Styles/Home.css'
import { useEffect, useState } from "react"
import Loader from "../../components/Loader"
import ContactForm from "../../components/ContactForm"

//Prefix CalssName:     main-home-

interface GapdivProps {
    height: string
}

const GapDiv : React.FC<GapdivProps> = ({height}) =>{
    return <div style={{height: height}}/>
}

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

const fadeInAnimationRightVariants = {
    initial: {
        opacity:0,
        x:-100,
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

const fadeInAnimationAppearVariants = {
    initial: {
        opacity:0,
    },
    animate: (value:number) => ({
        opacity:1,
        transition: {
            duration: 1,
            delay: value,
        },
        
    }),
}

function Home() {
    const [loaded, setLoaded] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const isLargeScreen = useMediaQuery('(min-width: 992px)');

    const images = [
        { url: imageCarousel1 },
        { url: imageCarousel2 },
        { url: imageCarousel3 },
        { url: imageCarousel4 },
    ];

    const imageProjects = [
        {
          title: 'The Brew Project',
          description: 'Working with Caribbean goods has been a pleasure from day one. Javier and the team have made sourcing ethical and high-quality coffee extremely easy, consistent, and most importantly all done with excellent service.',
          imageUrl: image1,
          logoUrl:roaster3,
        },
        {
          title: 'Thomsons Coffee',
          description: "We've been working with Javier for the past two years. He has been a key partner in our business, helping us source high-quality micro-lots from Guatemala. Javier is incredibly knowledgeable about coffee, but he also has a deep commitment to sustainability and ethical sourcing. He takes the time to visit each of the farms, building relationships with the farmers and ensuring that they're paid fairly for their hard work. Thanks to Javier's expertise and dedication, we've been able to offer our customers some of the best coffee on the market.",
          imageUrl: image2,
          logoUrl:roaster2,
        },
        {
          title: 'Fower',
          description: "'Great work, great story, great people and most importantly great coffee! We have worked with Caribbean Goods since opening our roastery and have managed to get some great coffees from them that our customers love. We have recommended Caribbean Goods to other roasters and will continue to do so. The passion and drive to work ethically and sustainably is clearly evident from Caribbean Goods. We would not get our Guatemalan coffee anywhere else!",
          imageUrl: image3,
          logoUrl:roaster1,
        },
      ];

    useEffect(() => {
    let timer = setTimeout(() => {
        setIsExiting(true);
        console.log(isExiting)
    }, 5000); // Tiempo para mostrar el loader
    return () => {
        clearTimeout(timer);
    };
    }, []);

    return (
        <div className='main-home-container'>
            {!loaded && 
            // <div className='bg-white h-screen w-full'>
                <Loader onExitComplete={() => setLoaded(true)} />
            // </div>
            } 
            <Header/>
            <div 
                className="h-screen bg-cover lg:bg-contain"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundRepeat:'no-repeat',
                    backgroundPosition: 'top',
                }}  
            >
                <div className="flex justify-center pt-[10vh]">
                    <p className="text-sm lg:text-base" style={{order:0}}>We are a small scale, ethical coffee importers.</p>
                </div>
                <GapDiv height={isLargeScreen ? '7.5vh' :'6.5vh'}/>
                <TextWButton text={'We Import green coffee'} route="About"/>
                
                <GapDiv height={isLargeScreen ? '45vh' : '42vh'}/>
                <TextWButton text={'Are you a roaster? Right this way'} route="Roasters"/>
                <div className='main-home-GuatemalaxUK'>
                    <p className="text-sm lg:text-base">Guatemala</p>
                    <FontAwesomeIcon onClick={()=>{}} className="main-home-doubleimplication-icon " icon={faArrowsLeftRight}></FontAwesomeIcon>
                    <p className="text-sm lg:text-base">United Kingdom</p>
                </div>
            </div>

            {/* ------------   Section 2 - CG2 -------------- */}
            <div className="main-home-cg2-container">
                <motion.div className="main-home-cg2-box1"
                    variants={fadeInAnimationLeftVariants}
                    initial='initial'
                    whileInView='animate'
                    viewport={{
                        once:true,
                    }}
                >
                    <p className="cg2-t1">Welcome to Caribbean Goods</p>
                </motion.div>
                <motion.div className="main-home-cg2-box2"
                    variants={fadeInAnimationRightVariants}
                    initial='initial'
                    whileInView='animate'
                    viewport={{
                        once:true,
                    }}
                >
                    <p className="cg2-t2">Finest Agricultural Imports</p>
                    <p className="cg2-t3">We supply speciality green coffee directly from ethical and sustainable farmers in Guatemala.</p>
                </motion.div>
            </div>

            <div className="hidden lg:flex flex-col items-center px-20 ">
                <h2 className="text-6xl text-[#044421] mt-20" style={{fontFamily:'KingsThing'}}>Hear from the people we work with</h2>
                <div className="flex justify-evenly w-full my-16">
                    {imageProjects.map((image, index) => (
                        <ImageCard
                        key={index}
                        title={image.title}
                        description={image.description}
                        imageUrl={image.imageUrl}
                        logoUrl={image.logoUrl}
                        />
                    ))}
                </div>
            </div>

            {/* ------------   Section 5 - CG5 -------------- */}
            <div className="main-home-cg5-container">
                <div className="cg5-container1">
                    <div >
                        <h1>Real Fair Coffee</h1>
                        <p style={{width:250}}>We source Specialty Green Coffee directly from ethical and sustainable farmers in Guatemala.</p>
                    </div>
                    <TextIconButton text="read more" route='/Ethos'/>
                </div>
                <div className="cg5-container2">
                    <p>Marcelino</p>
                </div>
            </div>
            <div className="main-home-cg5-container2">
                <motion.div
                    variants={fadeInAnimationAppearVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                        once:true,
                    }}
                    custom={0.2}
                >
                    <img src={vector1farmer} alt="" />
                    <p>We supply green coffee to roasters throughout the UK </p>
                    <TextIconButton text="Read more" route="/Roasters"/>
                </motion.div>
                <motion.div
                    variants={fadeInAnimationAppearVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                        once:true,
                    }}
                    custom={0.4}
                >
                    <img src={vector2farmer} alt="" />
                    <p>Our coffee really is ethical</p>
                    <TextIconButton text="Find out how" route="/Ethos"/>
                </motion.div>
                <motion.div
                    variants={fadeInAnimationAppearVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                        once:true,
                    }}
                    custom={0.6}
                >
                    <img src={vector3farmer} alt="" />
                    <p>Get in touch for more information</p>
                    <TextIconButton text="Say hello" route={"/Contact"}/>
                </motion.div>
            </div>
            {/* --------------- Forms Section --------------------- */}
            <div className="home-main-cg5-forms">
                <div className="flex flex-col lg:flex-row w-full h-full lg:h-[80vh]">
                    {/* Image Section */}
                    <div className="w-full lg:w-1/2">
                        <img src={image1Form} className="h-full w-full object-cover" alt="" />
                    </div>

                    {/* Form Section */}
                    <div className="w-full lg:w-1/2 bg-[#e6a318] text-[#044421] flex flex-col justify-center items-center">
                        <div className="w-[80%] lg:w-[50%] py-20">
                            <h2 className="text-3xl font-bold mb-2" style={{fontFamily:"KingsThing"}}>Join our Mailing List</h2>
                            <p className="mb-4">Sign-up below to get a monthly update</p>
                            <h3 className="text-xl font-bold mb-2 mt-8">Get Updates</h3>
                            <p className="mb-4 text-xs">Subscribe to our newsletter, and be the first to get the latest news & updates.</p>
                        
                            {/* Form */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email here*" 
                                    className="text-xs py-4 px-8 rounded-full w-full lg:w-auto flex-grow bg-yellow-500 text-white placeholder-white focus:outline-none focus:ring-0"
                                />
                                <button className="text-xs py-4 px-8 rounded-full bg-[#eecc84] hover:bg-yellow-400 text-white w-auto">Subscribe</button>
                            </div>

                            <div className=" flex items-start mt-8">
                                <SocialMedia 
                                    instagramLink="https://www.instagram.com/caribbeangoods/" 
                                    facebookLink="https://www.facebook.com/caribbeangoodsuk/posts/2171011849881565/"
                                    linkedinLink="https://www.linkedin.com/company/caribbean-goods-ltd/?originalSubdomain=uk"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row w-full h-full lg:h-[80vh]">
                    <div className="w-full lg:w-1/2 bg-[#628f76] flex justify-center items-center">
                        <ContactForm/>
                    </div>
                    {/* Image Section */}
                    <div className="w-full lg:w-1/2">
                        <img src={image2Form} className="h-full w-full object-cover" alt="" />
                    </div>
                </div>
            </div>
            {/* --------------- Coffee With A Kick --------------------- */}
            <div className="cwk">
                <h1>Coffee with a kick!</h1>
                <div className="cwk-containers">
                    <div className="cwk-1">
                        <svg viewBox="0 0 45 45" fill="#FAFAFA" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.5 8.5C16.914 8.5 18.885 10.401 18.995 12.788L19 13V17.698L24.405 13.696C24.733 13.453 25.172 13.437 25.514 13.642L25.625 13.719L31 18.02V14.5H33V19.62L35.625 21.719L34.375 23.281L33 22.18L32.999 26.5H35C35.513 26.5 35.936 26.886 35.993 27.383L36 27.5V35.5C36 36.013 35.614 36.436 35.117 36.493L35 36.5H8V34.5H15.545L17.295 32.5H8V30.5H19V30.552L20.795 28.5H8V26.5H10V13C10 10.515 12.015 8.5 14.5 8.5ZM26.795 28.5H23.453L18.203 34.5H21.545L26.795 28.5ZM34 30.16L30.203 34.5H34V30.16ZM32.795 28.5H29.453L24.203 34.5H27.545L32.795 28.5ZM31 20.58L24.976 15.761L19 20.187V26.5H21.999L22 22.5C22 21.987 22.386 21.564 22.883 21.507L23 21.5H27C27.513 21.5 27.936 21.886 27.993 22.383L28 22.5L27.999 26.5H30.999L31 20.58ZM14.5 10.5C13.175 10.5 12.09 11.532 12.005 12.836L12 13V26.5H17V13C17 11.619 15.881 10.5 14.5 10.5ZM26 23.5H24V26.5H26V23.5Z" fill="#FAFAFA"/>
                        </svg>
                        <h2>Direct trade with farms</h2>
                        <p>At Caribbean Goods, we give farmers more control and ensure they are paid fairly for their work. We cut out the middleman, pay upfront and pay more than they would receive selling their coffee in the commodity market.</p>
                    </div>
                    <div className="cwk-2">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.0007 13.537L12.5959 13.0807C12.454 12.8955 12.234 12.787 12.0007 12.787C11.7675 12.787 11.5475 12.8955 11.4055 13.0807L12.0007 13.537ZM8.88974 15.066L8.89204 14.316C8.88678 14.316 8.88153 14.316 8.87627 14.3161L8.88974 15.066ZM8.44674 7.443L8.52022 8.18939C8.76089 8.1657 8.97537 8.02741 9.09627 7.81797C9.21718 7.60853 9.22968 7.35364 9.12984 7.13338L8.44674 7.443ZM8.11174 5.889L8.86174 5.88968V5.889H8.11174ZM15.8897 5.889H15.1397V5.88968L15.8897 5.889ZM15.5547 7.443L14.8716 7.13338C14.7718 7.35364 14.7843 7.60853 14.9052 7.81797C15.0261 8.02741 15.2406 8.1657 15.4813 8.18939L15.5547 7.443ZM18.9949 11.4673L18.2462 11.4238V11.4238L18.9949 11.4673ZM15.1117 15.066L15.1252 14.3161C15.12 14.316 15.1147 14.316 15.1094 14.316L15.1117 15.066ZM12.7507 13.537C12.7507 13.1228 12.415 12.787 12.0007 12.787C11.5865 12.787 11.2507 13.1228 11.2507 13.537H12.7507ZM11.2507 21.066C11.2507 21.4802 11.5865 21.816 12.0007 21.816C12.415 21.816 12.7507 21.4802 12.7507 21.066H11.2507ZM11.2507 13.537C11.2507 13.9512 11.5865 14.287 12.0007 14.287C12.415 14.287 12.7507 13.9512 12.7507 13.537H11.2507ZM12.7507 11.551C12.7507 11.1368 12.415 10.801 12.0007 10.801C11.5865 10.801 11.2507 11.1368 11.2507 11.551H12.7507ZM12.7507 8.566C12.7507 8.15179 12.415 7.816 12.0007 7.816C11.5865 7.816 11.2507 8.15179 11.2507 8.566H12.7507ZM11.2507 9.566C11.2507 9.98021 11.5865 10.316 12.0007 10.316C12.415 10.316 12.7507 9.98021 12.7507 9.566H11.2507ZM12.4507 10.166C12.7821 9.91747 12.8493 9.44737 12.6007 9.116C12.3522 8.78463 11.8821 8.71747 11.5507 8.966L12.4507 10.166ZM9.55074 10.466C9.21937 10.7145 9.15221 11.1846 9.40074 11.516C9.64927 11.8474 10.1194 11.9145 10.4507 11.666L9.55074 10.466ZM12.7507 9.566C12.7507 9.15179 12.415 8.816 12.0007 8.816C11.5865 8.816 11.2507 9.15179 11.2507 9.566H12.7507ZM11.2507 11.551C11.2507 11.9652 11.5865 12.301 12.0007 12.301C12.415 12.301 12.7507 11.9652 12.7507 11.551H11.2507ZM12.2829 10.8561C11.8991 10.7003 11.4616 10.8851 11.3058 11.2689C11.15 11.6527 11.3348 12.0901 11.7186 12.2459L12.2829 10.8561ZM14.2186 13.2609C14.6024 13.4167 15.0398 13.2319 15.1956 12.8481C15.3515 12.4643 15.1667 12.0269 14.7829 11.8711L14.2186 13.2609ZM11.4055 13.0807C10.8064 13.8621 9.87675 14.319 8.89204 14.316L8.88743 15.816C10.3403 15.8205 11.7119 15.1463 12.5959 13.9933L11.4055 13.0807ZM8.87627 14.3161C7.22834 14.3457 5.8509 13.0692 5.75528 11.4238L4.2578 11.5108C4.40013 13.9599 6.45037 15.8599 8.90321 15.8159L8.87627 14.3161ZM5.75528 11.4238C5.65965 9.77837 6.87996 8.35087 8.52022 8.18939L8.37326 6.69661C5.93183 6.93696 4.11548 9.06171 4.2578 11.5108L5.75528 11.4238ZM9.12984 7.13338C8.95276 6.74269 8.86135 6.31863 8.86174 5.88968L7.36174 5.88832C7.36115 6.53131 7.49819 7.16698 7.76363 7.75262L9.12984 7.13338ZM8.86174 5.889C8.86174 4.15538 10.2671 2.75 12.0007 2.75V1.25C9.43869 1.25 7.36174 3.32695 7.36174 5.889H8.86174ZM12.0007 2.75C13.7344 2.75 15.1397 4.15538 15.1397 5.889H16.6397C16.6397 3.32695 14.5628 1.25 12.0007 1.25V2.75ZM15.1397 5.88968C15.1401 6.31863 15.0487 6.74269 14.8716 7.13338L16.2378 7.75262C16.5033 7.16698 16.6403 6.53131 16.6397 5.88832L15.1397 5.88968ZM15.4813 8.18939C17.1215 8.35087 18.3418 9.77837 18.2462 11.4238L19.7437 11.5108C19.886 9.06171 18.0696 6.93696 15.6282 6.69661L15.4813 8.18939ZM18.2462 11.4238C18.1506 13.0692 16.7731 14.3457 15.1252 14.3161L15.0983 15.8159C17.5511 15.8599 19.6013 13.9599 19.7437 11.5108L18.2462 11.4238ZM15.1094 14.316C14.1247 14.319 13.1951 13.8621 12.5959 13.0807L11.4055 13.9933C12.2895 15.1463 13.6612 15.8205 15.114 15.816L15.1094 14.316ZM11.2507 13.537V21.066H12.7507V13.537H11.2507ZM12.7507 13.537V11.551H11.2507V13.537H12.7507ZM11.2507 8.566V9.566H12.7507V8.566H11.2507ZM11.5507 8.966L9.55074 10.466L10.4507 11.666L12.4507 10.166L11.5507 8.966ZM11.2507 9.566V11.551H12.7507V9.566H11.2507ZM11.7186 12.2459L14.2186 13.2609L14.7829 11.8711L12.2829 10.8561L11.7186 12.2459Z" fill="#FAFAFA"/>
                        </svg>
                        <h2>Planting Trees</h2>
                        <p>We plant a tree for every bag of 30kg of coffee from Hunbatz! With  Trees for Life UK, we have planted hundreds of trees in the Scottish highlands; check it out.</p>
                    </div>
                    <div className="cwk-3">
                        <svg  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19C9.49345 19 7.91806 17.6547 6.86651 16.3888C6.42721 15.8599 5.58617 15.867 5.20168 16.4323C4.50078 17.4629 3.68402 18.4127 2 18.7859M22 18.7859C20.4123 18.4341 19.5955 17.5697 18.9199 16.6083C18.4965 16.0059 17.5655 16.0425 17.1055 16.6208C16.6953 17.1365 16.2063 17.6119 15.6148 18" stroke="#FAFAFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 9C14.5065 9 16.0819 7.65471 17.1335 6.38877C17.5728 5.85991 18.4138 5.86697 18.7983 6.43233C19.4992 7.46288 20.316 8.41274 22 8.78594M2 8.78594C3.58767 8.4341 4.40448 7.56969 5.08009 6.60834C5.50345 6.00591 6.43454 6.04252 6.89447 6.62076C7.30467 7.13646 7.79373 7.6119 8.38519 8" stroke="#FAFAFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 13.7859C20.4123 13.4341 19.5955 12.5697 18.9199 11.6083C18.4965 11.0059 17.5655 11.0425 17.1055 11.6208C16.0541 12.9427 14.4844 14 12 14C9.49345 14 7.91806 12.6547 6.86651 11.3888C6.42721 10.8599 5.58617 10.867 5.20168 11.4323C4.50078 12.4629 3.68402 13.4127 2 13.7859" stroke="#FAFAFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h2>Sustainable Farming</h2>
                        <p>We work with sustainable farms, using new techniques that use  90% less water than traditional coffee farming practices. Others have water treatment facilities where the water gets re-introduce to the process.</p>
                    </div>
                </div>
                <TextIconButton text="read more" route={'/Ethos'}/>
                {/* ------------------ Roasters Bs ---------------------- */}
            </div>
            <Roasters/>
            <ImageCarousel images={images}/>
            <Footer/>
        </div>
    )
}


export default Home

