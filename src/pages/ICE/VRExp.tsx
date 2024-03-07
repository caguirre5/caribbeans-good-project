import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"
import './VRExp.css'

function VRExperience() {
    return (
        <div className="vr-page-container">
            <Header/>
            <div className="main">
                <h1>VR EXPERIENCE</h1>
                <div>
                <iframe
                    title="3Dvista Tour"
                    src="https://caribbeangoodsvr.online/"
                    allowFullScreen
                ></iframe>
                </div>
            </div>
            <Footer/>
        </div>
    )
}

export default VRExperience