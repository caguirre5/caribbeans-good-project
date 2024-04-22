import Header from "../../components/HeaderControls"

import { useMediaQuery } from 'usehooks-ts'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLongArrowRight, faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import './Styles/Home.css'

//Prefix CalssName:     main-home-

interface GapdivProps {
    height: string
}

interface TextWButtonProps {
    text:string,
    order?:number,
    route?:string,
}

const GapDiv : React.FC<GapdivProps> = ({height}) =>{
    return <div style={{height: height}}/>
}

const TextWButton : React.FC<TextWButtonProps> = ({text, order = 0, route}) => {
    return (
        <div className='main-home-text-w-button-1' style={{order:order}}>
            <p>{text}</p>
            <div className='main-home-icon-container'>
                <FontAwesomeIcon onClick={()=>{}} className='main-home-icon' icon={faLongArrowRight} />
            </div>
        </div>
    )
}

function Home() {
    const isLargeScreen = useMediaQuery('(min-width: 992px)');
    return (
        <div className='main-home-container'>
            <Header/>
            <div className="main-home-landing-container">
                <div style={{display:'flex', justifyContent:'center'}}>
                    <p style={{order:0}}>We are a small scale, ethical coffee importers.</p>
                </div>
                <GapDiv height={isLargeScreen ? '9vh' : '7.5vh'}/>
                <TextWButton text={'We Import green coffee'}/>
                
                <GapDiv height={isLargeScreen ? '45vh' : '42vh'}/>
                <TextWButton text={'Are you a roaster? Right this way'}/>
                <div className='main-home-GuatemalaxUK'>
                    <p>Guatemala</p>
                    <FontAwesomeIcon onClick={()=>{}} className="main-home-doubleimplication-icon " icon={faArrowsLeftRight}></FontAwesomeIcon>
                    <p>United Kingdom</p>
                </div>
            </div>
        </div>
    )
}


export default Home

