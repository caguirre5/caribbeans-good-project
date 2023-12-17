// import React from "react"
import './Landing.css'
import logo from '../../assets/white_logo.png'
import VRVector from '../../assets/Illos23/VR-3D-vector.png'
import bottomVector from '../../assets/Illos23/bottom-vector.png'

function Landing() {
    return (
        <div className="page-container">
            <div className="logo-header-container">
                <img src={logo} alt="Logo"/>
            </div>
            <div className='section1'>
                <div className='text-slogan'>
                    <p>This is the ultimate coffee-tasting experience, are you ready?</p>
                </div>
                <div className='vectorial-art-1'>

                </div>
                <div className='buttons-ice'>
                    <div className='b1' onClick={() => {console.log('VR Experience')}}>VR Experience</div>
                    <div className='b2' onClick={() => {}}>The Coffee Process</div>
                </div>
                <div className=''>

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

            </div>
        </div>
    )
}

export default Landing