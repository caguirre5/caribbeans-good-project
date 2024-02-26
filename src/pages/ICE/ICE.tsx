import './ICE.css'
import vector1 from '../../assets/Illos23/vector_play.png'
import imageBox from '../../assets/ICE/Package Box Mockup-yellow.jpg'
import VRVector from '../../assets/Illos23/VR-3D-vector.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faLongArrowRight } from '@fortawesome/free-solid-svg-icons';
import imageBoxLett from '../../assets/ICE/ICEBox-02c.jpg'
import imgbox_2 from '../../assets/ICE/Vrboxmock.jpg'
import gif1 from '../../assets/GIFS/GIF_2702.gif'
import { motion, useViewportScroll, useTransform } from 'framer-motion';

//Animations
import { PushDiv, BouncingDiv, RotatorDiv } from '../../components/Animations'


// Vectorial art
import Vector1 from '../../assets/Illos23/VR.png'
import Vector2 from '../../assets/Illos23/COFFEE.png'
import Vector3 from '../../assets/Illos23/BT.png'
import Vector4 from '../../assets/Illos23/GRN.png'
import Vector5 from '../../assets/Illos23/CUOP.png'
import Vector6 from '../../assets/Illos23/SPN.png'

interface VectorItemProps {
    imageSrc: any;
    title: string;
    description: string;
}

const ItemBox: React.FC<VectorItemProps> = ({imageSrc, title, description}) => {
    return (
        <BouncingDiv 
            className='grid-vectors-item'
        >
            <img src={imageSrc} alt={`vectorial art of ${title}`} />
            <h2>{title}</h2>
            <p>{description}</p>
        </BouncingDiv>
    )
}

function ICE() {

    const { scrollYProgress } = useViewportScroll();

    const scale = useTransform(scrollYProgress, [0, 1], [-1.5, 1]);
    
    return (
        <div className='page-container-ice'>
            <div className='vectorial-art-2'>
                    <div className='logo-margin'></div>
                    <div className='landing-mid-container'>
                        <BouncingDiv className="vertical-text"
                        >
                            <p>ICE</p>
                        </BouncingDiv>
                        <div className=''>
                            <motion.div className=''
                                initial={{ scale: 0 }}
                                animate={{ rotate: 180, scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 20
                                }}
                            >
                                <img className='box-image' src={imageBox} alt="" />
                            </motion.div>
                        </div>
                        
                        <div className='cross-text'>
                            <p className='cross-p1'>Immersive</p>
                            <p className='cross-p2'>Coffee</p>
                            <p className='cross-p3'>Experience</p>
                        </div>
                    </div>
                    <div className='landing-lower-container'>
                        
                    <div className='vertical-vector'>
                            <img src={vector1} alt="" />
                        </div>
                        <BouncingDiv className="hor-text"
                        >
                            <p>BOX</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                        </BouncingDiv>
                    </div>
                    <div className='text-slogan2'>
                        <p>This is the ultimate coffee-tasting experience, are you ready?</p>
                    </div>
                </div>
            <BouncingDiv className='vr-vector' 
            >
                <p>You've never had one like this before</p>
                <img src={VRVector}/>
            </BouncingDiv>
            <div className='whatsinside-items'>
                <h1>What's inside the box?</h1>
                <div className='grid-vectors-6x2'>
                    <ItemBox 
                        imageSrc={Vector1} 
                        title='VR Headset' 
                        description='compatible with iphone/android' 
                    />
                    <ItemBox 
                        imageSrc={Vector2} 
                        title='Speciality Coffee' 
                        description='4 varieties of Guatemalan Coffee' 
                    />
                    <ItemBox 
                        imageSrc={Vector3} 
                        title='Bluetooth Controller' 
                        description='' 
                    />
                    <ItemBox 
                        imageSrc={Vector4} 
                        title='Grinder' 
                        description='Manual coffee grinder' 
                    />
                    <ItemBox 
                        imageSrc={Vector5} 
                        title='Tasting Cup' 
                        description='professional coffee tasting cup' 
                    />
                    <ItemBox 
                        imageSrc={Vector6} 
                        title='Spoon' 
                        description='professional coffee tasting spoon' 
                    />
                </div>
                <div className='plus-section'>
                    <RotatorDiv
                        className=''
                    >
                        <FontAwesomeIcon className='plus-symbol' icon={faPlus} />
                    </RotatorDiv>
                    <PushDiv className='plus-section-text'>
                            <p>You will have access to our online library of Virtual Reality videos and a walk through of the coffee process from growing in Guatemala all the way to your cup. Meet the farmers, see the farms and learn all about the coffee in a professionally lead cupping session using the tools in the box to give an amazing experience like no other! </p>
                    </PushDiv>
                </div>
                <div className='minus-section'>
                    <div className='minus-section-video'></div>
                    <RotatorDiv
                        className=''
                    >
                        <FontAwesomeIcon className='minus-symbol' icon={faMinus} />
                    </RotatorDiv>
                </div>
                <div className='icebox-banner'>
                    <img src={imageBoxLett} alt="" />
                </div>
            </div>
            <div className='order-section shapedividers_com-4452 '>
                <div className='gif-section'>
                    <img src={gif1} alt="" />
                    <div>
                        <h2>Pre-Order your box now and save £70!</h2>
                        <p>We have a limited offer for this one off experience box. Order your box now and we will ship them out to you as soon as we officially launch!</p>
                        <motion.div className='order-button' whileHover={{ scale: 1.2 }}>
                            <p>let's do it</p>
                            <FontAwesomeIcon className='arrow-icon' icon={faLongArrowRight} />
                        </motion.div>
                    </div>
                </div>
                <div className='order-img-section'>
                    <div className='img-container'>
                        <img src={imgbox_2} alt="" />
                        <div className='img-button'>PRE-ORDER</div>
                    </div>
                    <div className='information-text'>
                        <h3>VR Coffee Tasting Experience</h3>
                        <p>£160.00 £90.00</p>
                        <motion.div className='order-button' whileHover={{ scale: 1.2 }}>
                            <p>Pre-order yours</p>
                            <FontAwesomeIcon className='arrow-icon' icon={faLongArrowRight} />
                        </motion.div>
                    </div>
                </div>
            </div>
            <div className='shapedividers_com-1295'></div>
            <div className='phrase-section ' >
                <motion.h1
                    style={{
                    scale
                  }}
                >We're all friends with a coffee geek, who's yours?</motion.h1>
                <motion.h3
                    style={{
                    scale
                  }}
                >Share us with the biggest coffee nerd you know...</motion.h3>
            </div>
        </div>
    )
}

export default ICE