import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"
import './VRExp.css'

import Farm1 from '../../assets/ICE/FarmNames/Amatillo.png'
import Farm2 from '../../assets/ICE/FarmNames/Hunbatz.png'
import Farm3 from '../../assets/ICE/FarmNames/San José Ocaña.png'
import Farm4 from '../../assets/ICE/FarmNames/El Socorro.png'

function VRExperience() {
    return (
        <div className="vr-page-container">
            <Header/>
            <div className="main">
                <h1>VR EXPERIENCE</h1>
                <div>
                {/* <iframe
                    title="3Dvista Tour"
                    src="https://caribbeangoodsvr.online/"
                    allowFullScreen
                ></iframe> */}
                </div>
                <div className="grid-cards">
                    <a><img className='card' src={Farm1} alt="" /></a>
                    <a href="https://caribbeangoodsvr.online/"><img className='card' src={Farm2} alt="" /></a>
                    <a><img className='card' src={Farm3} alt="" /></a>
                    <a><img className='card' src={Farm4} alt="" /></a>
                </div>
            </div>
            <Footer/>
        </div>
    )
}

export default VRExperience