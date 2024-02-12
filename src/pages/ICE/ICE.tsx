import './ICE.css'
import vector1 from '../../assets/Illos23/vector_play.png'
import imageBox from '../../assets/ICE/Package Box Mockup-yellow.jpg'
import VRVector from '../../assets/Illos23/VR-3D-vector.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faLongArrowRight } from '@fortawesome/free-solid-svg-icons';
import imageBoxLett from '../../assets/ICE/ICEBox-02c.jpg'
import imgbox_2 from '../../assets/ICE/Vrboxmock.jpg'
import gif1 from '../../assets/GIFS/GIF_2702.gif'
import { motion } from 'framer-motion';


// Vectorial art
import Vector1 from '../../assets/Illos23/VR.png'
import Vector2 from '../../assets/Illos23/COFFEE.png'
import Vector3 from '../../assets/Illos23/BT.png'
import Vector4 from '../../assets/Illos23/GRN.png'
import Vector5 from '../../assets/Illos23/CUOP.png'
import Vector6 from '../../assets/Illos23/SPN.png'

function ICE() {
    return (
        <div className='page-container-ice'>
            <div className='vectorial-art-2'>
                    <div className='logo-margin'></div>
                    <div className='landing-mid-container'>
                        <motion.div className="vertical-text"
                            initial={{
                                opacity:0, 
                                y:-25
                            }}
                            whileInView={{
                                opacity:1,
                                y:0
                            }}
                            transition={{
                                duration: 1,
                                delay: 0.8
                            }}
                        >
                            <p>ICE</p>
                        </motion.div>
                        <div className=''>
                            <motion.div className=''
                                initial={{
                                    opacity:0, 
                                }}
                                whileInView={{
                                    opacity:1,
                                }}
                                transition={{
                                    duration: 1,
                                    delay: 0.3
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
                        <motion.div className="hor-text"
                            initial={{
                                opacity:0, 
                                x:-25
                            }}
                            whileInView={{
                                opacity:1,
                                x:0
                            }}
                            transition={{
                                duration: 1,
                                delay: 0.8
                            }}
                        >
                            <p>BOX</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                        </motion.div>
                    </div>
                    <div className='text-slogan2'>
                        <p>This is the ultimate coffee-tasting experience, are you ready?</p>
                    </div>
                </div>
            <div className='vr-vector'>
                <p>You've never had one like this before</p>
                <img src={VRVector}/>
            </div>
            <div className='whatsinside-items'>
                <h1>What's inside the box?</h1>
                <div className='grid-vectors-6x2'>
                    <div className='grid-vectors-item'>
                        <img src={Vector1} alt="vectorial art of what's inside" />
                        <h2>VR Headset</h2>
                        <p>compatible with iphone/android</p>
                    </div>
                    <div className='grid-vectors-item'>
                        <img src={Vector2} alt="vectorial art of what's inside" />
                        <h2>Speciality Coffee</h2>
                        <p>4 varieties of Guatemalan Coffee</p>
                    </div>
                    <div className='grid-vectors-item'>
                        <img src={Vector3} alt="vectorial art of what's inside" />
                        <h2>Bluetooth Controller</h2>
                        <p></p>
                    </div>
                    <div className='grid-vectors-item'>
                        <img src={Vector4} alt="vectorial art of what's inside" />
                        <h2>Grinder</h2>
                        <p>Manual coffee grinder</p>
                    </div>
                    <div className='grid-vectors-item'>
                        <img src={Vector5} alt="vectorial art of what's inside" />
                        <h2>Tasting Cup</h2>
                        <p>professional coffee tasting cup</p>
                    </div>
                    <div className='grid-vectors-item'>
                        <img src={Vector6} alt="vectorial art of what's inside" />
                        <h2>Spoon</h2>
                        <p>professional coffee tasting spoon</p>
                    </div>
                </div>
                <div className='plus-section'>
                    <FontAwesomeIcon className='plus-symbol' icon={faPlus} />
                    <div className='plus-section-text'>
                        <p>You will have access to our online library of Virtual Reality videos and a walk through of the coffee process from growing in Guatemala all the way to your cup. Meet the farmers, see the farms and learn all about the coffee in a professionally lead cupping session using the tools in the box to give an amazing experience like no other! </p>
                    </div>
                </div>
                <div className='minus-section'>
                    <div className='minus-section-video'></div>
                    <FontAwesomeIcon className='minus-symbol' icon={faMinus} />
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
                        <div className='order-button'>
                            <p>let's do it</p>
                            <FontAwesomeIcon className='arrow-icon' icon={faLongArrowRight} />
                        </div>
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
                        <div className='order-button'>
                            <p>Pre-order yours</p>
                            <FontAwesomeIcon className='arrow-icon' icon={faLongArrowRight} />
                        </div>
                    </div>
                </div>
            </div>
            <div className='shapedividers_com-1295'></div>
            <div className='phrase-section ' >
                <h1>We're all friends with a coffee geek, who's yours?</h1>
                <h3>Share us with the biggest coffee nerd you know...</h3>
            </div>
        </div>
    )
}

export default ICE