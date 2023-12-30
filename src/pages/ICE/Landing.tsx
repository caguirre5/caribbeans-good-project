// import React from "react"
import './Landing.css'
import logo from '../../assets/white_logo.png'
import VRVector from '../../assets/Illos23/VR-3D-vector.png'
import bottomVector from '../../assets/Illos23/bottom-vector.png'
import iceBox from '../../assets/ICE/Vr box mock (1).jpg'
import vector1 from '../../assets/Illos23/vector_play.png'
import leftVector from '../../assets/Illos23/left-vector.png'
import rightVector from '../../assets/Illos23/right-vector.png'
import { useNavigate } from 'react-router-dom';

function Landing() {
    const navigate = useNavigate();

    const redirectTo = (route: string) => {
        navigate(route); 
    };

    return (
        <div className="page-container">
            <div className="logo-header-container">
                <img src={logo} alt="Logo"/>
            </div>
            <div className='section1'>
                <div className='vectorial-art-1'>
                    <div className='logo-margin'></div>
                    <div className='text-slogan'>
                        <p>This is the ultimate coffee-tasting experience, are you ready?</p>
                    </div>
                    <div className='landing-mid-container'>
                        <div className="vertical-text">
                            <p>ICE</p>
                        </div>
                        <div className='vector-container'>
                            <div className='vector-image'>
                                <img className='vector-image-i1' src={leftVector} alt="" />
                                <img className='vector-image-i2' src={rightVector} alt="" />
                            </div>
                            <div className='buttons-ice'>
                                <div className='b1' onClick={() => {console.log('VR Experience')}}>VR Experience</div>
                                <div className='b2' onClick={() => redirectTo('/CoffeeProcess')}>The Coffee Process</div>
                            </div>
                        </div>
                        <div className='vertical-vector'>
                            <img src={vector1} alt="" />
                        </div>
                    </div>
                    <div className='landing-lower-container'>
                        <div className='cross-text'>
                            <p className='cross-p1'>Immersive</p>
                            <p className='cross-p2'>Coffee</p>
                            <p className='cross-p3'>Experience</p>
                        </div>
                        <div className="hor-text">
                            <p>BOX</p>
                        </div>
                    </div>
                </div>
                <div className='vr-experience-vector'>
                    <p>You've never had one like this before</p>
                    <img src={VRVector}/>
                </div>
                <div className='inside-box'>
                    <h3>Inside your box</h3>
                    <ul className="list-box">
                        <li>VR Headset compatible with Iphone/Android</li>
                        <li>Bluetooth controller for VR</li>
                        <li>Four Varieties of speciality coffee</li>
                        <li>Manual coffee grinder</li>
                        <li>Professional coffee tasting cup</li>
                        <li>Professional coffee tasting spoon</li>
                    </ul>
                </div>
                <div className='video-section'>
                    <div className='video'></div>

                </div>
            </div>
            <img src={bottomVector}/>
            <div className='section2'>
                {/* <img className='ice-box-image' src={iceBox}/> */}
                <div className='QAsContainer'>
                    <h3>Got a Question?</h3>
                    <p onClick={() => redirectTo('/FAQs')}>Check out our FAQ's</p>
                    <p>Send us a message</p>
                </div>
            </div>
        </div>
    )
}

export default Landing