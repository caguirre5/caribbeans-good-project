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
                <h1>Tour 360</h1>
                <iframe
                    title="3Dvista Tour"
                    src="https://storage.net-fs.com/hosting/2727323/487/"
                    allowFullScreen
                ></iframe>
                </div>
            </div>
            <Footer/>
        </div>
    )
}

export default VRExperience