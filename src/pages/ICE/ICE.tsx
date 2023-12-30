import './ICE.css'
import vector1 from '../../assets/Illos23/vector_play.png'
import imageBox from '../../assets/ICE/Package Box Mockup-yellow.jpg'
import VRVector from '../../assets/Illos23/VR-3D-vector.png'

function ICE() {
    return (
        <div className='page-container-ice'>
            <div className='vectorial-art-1'>
                    <div className='logo-margin'></div>
                    <div className='landing-mid-container'>
                        <div className="vertical-text">
                            <p>ICE</p>
                        </div>
                        <div className=''>
                            <div className=''>
                                <img className='box-image' src={imageBox} alt="" />
                            </div>
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
                        <div className="hor-text">
                            <p>BOX</p>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                        </div>
                    </div>
                    <div className='text-slogan'>
                        <p>This is the ultimate coffee-tasting experience, are you ready?</p>
                    </div>
                </div>
            <div className='vr-vector'>
                <p>You've never had one like this before</p>
                <img src={VRVector}/>
            </div>
        </div>
    )
}

export default ICE