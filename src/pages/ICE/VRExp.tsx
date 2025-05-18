import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer"
import './VRExp.css'

import Farm1 from '../../assets/ICE/FarmNames/Amatillo.png'
import Farm2 from '../../assets/ICE/FarmNames/Hunbatz.png'
import Farm3 from '../../assets/ICE/FarmNames/San José Ocaña.png'
import Farm4 from '../../assets/ICE/FarmNames/El Socorro.png'
import { motion } from 'framer-motion';

interface VideoCardProps {
    url: string;
    src: string;
    text: string;
  }
  
  const VideoCard: React.FC<VideoCardProps> = ({ url, src, text }) => {
    return (
      <motion.div className="card-item-container"
      whileHover={{ scale: 1.1 }}
      >
        <a className='card-item' href={url}><img className='card' src={src} alt={text} /></a>
      </motion.div>
    );
  };

function VRExperience() {
    return (
        <div className="vr-page-container">
            <Header/>
            <div className="main">
                <h1>WELCOME TO THE VR EXPERIENCE</h1>
                <div>
                {/* <iframe
                    title="3Dvista Tour"
                    src="https://caribbeangoodsvr.online/"
                    allowFullScreen
                ></iframe> */}
                </div>
                <div className="grid-cards">
                    <VideoCard url='' src={Farm1} text=""/>
                    <VideoCard url='https://caribbeangoodsvr.xyz/' src={Farm2} text=""/>
                    <VideoCard url='' src={Farm3} text=""/>
                    <VideoCard url='' src={Farm4} text=""/>
                </div>
            </div>
            <Footer/>
        </div>
    )
}

export default VRExperience