// import React from "react"
import './Landing.css'
import logo from '../../assets/white_logo.png'
import VRVector from '../../assets/Illos23/VR-3D-vector.png'
import bottomVector from '../../assets/Illos23/bottom-vector.png'
import iceBox from '../../assets/ICE/Vrboxmock.jpg'
import vector1 from '../../assets/Illos23/vector_play.png'
import leftVector from '../../assets/Illos23/left-vector.png'
import rightVector from '../../assets/Illos23/right-vector.png'
import { useNavigate } from 'react-router-dom';


import { BouncingDiv, ZoomedButton, PushDiv } from '../../components/Animations'

function Landing() {
    const navigate = useNavigate();

    const redirectTo = (route: string) => {
        navigate(route); 
    };

    return (
        <div className="page-container">
            <div className="logo-header-container">
                <img src={logo} alt="Logo" onClick={() => redirectTo('/ICE')}/>
            </div>
            <div className='section1'>
                <div className='vectorial-art-1'>
                    <div className='logo-margin'></div>
                    <div className='text-slogan'>
                        <p>This is the ultimate coffee-tasting experience, are you ready?</p>
                    </div>
                    <div className='landing-mid-container'>
                        <BouncingDiv className="vertical-text">
                            <p>ICE</p>
                        </BouncingDiv>
                        <div className='vector-container'>
                            <div className='vector-image'>
                                <img className='vector-image-i1' src={leftVector} alt="" />
                                <img className='vector-image-i2' src={rightVector} alt="" />
                            </div>
                            <div className='buttons-ice'>
                                <ZoomedButton className='b1' onClick={() => redirectTo('/VRExperience')}>VR Experience</ZoomedButton>
                                <ZoomedButton className='b2' onClick={() => redirectTo('/CoffeeProcess')}>The Coffee Process</ZoomedButton>
                            </div>
                        </div>
                        <BouncingDiv className='vertical-vector'>
                            <img src={vector1} alt="" />
                        </BouncingDiv>
                    </div>
                    <div className='landing-lower-container'>
                        <BouncingDiv className='cross-text'>
                            <p className='cross-p1'>Immersive</p>
                            <p className='cross-p2'>Coffee</p>
                            <p className='cross-p3'>Experience</p>
                        </BouncingDiv>
                        <BouncingDiv className="hor-text">
                            <p>BOX</p>
                        </BouncingDiv>
                    </div>
                </div>
                <div className='vr-experience-vector'>
                    <p>You've never had one like this before</p>
                    <BouncingDiv className=''>

                        <img src={VRVector}/>
                    </BouncingDiv>
                </div>
                <div className='inside-box'>
                    <h3>Inside your box</h3>
                    <ul className="list-box">
                        <ZoomedButton className=''>
                            <li>VR Headset compatible with Iphone/Android</li>
                        </ZoomedButton>
                        <ZoomedButton className=''>
                            <li>Bluetooth controller for VR</li>
                        </ZoomedButton>
                        <ZoomedButton className=''>
                            <li>Four Varieties of speciality coffee</li>
                        </ZoomedButton>
                        <ZoomedButton className=''>
                            <li>Manual coffee grinder</li>
                        </ZoomedButton>
                        <ZoomedButton className=''>
                            <li>Professional coffee tasting cup</li>
                        </ZoomedButton>
                        <ZoomedButton className=''>
                            <li>Professional coffee tasting spoon</li>
                        </ZoomedButton>
                        
                    </ul>
                </div>
                <PushDiv className='video-section'>
                    {/* <div className='video'></div> */}
                    <iframe
                        className='video'
                        src='https://www.youtube.com/embed/9ZM9zf2mnJM'
                        title='YouTube video player'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                    ></iframe>
                </PushDiv>
            </div>
            <img className="bottom-border" src={bottomVector}/>
            <div className='section2'>
                <img className='ice-box-image' src={iceBox}/>
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