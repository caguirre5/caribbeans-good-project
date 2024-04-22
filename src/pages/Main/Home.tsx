import Header from "../../components/HeaderControls"

import {motion} from 'framer-motion'

import { useMediaQuery } from 'usehooks-ts'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLongArrowRight, faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';

import vector1farmer from '../../assets/Images/Vectors/vector1-farmers.png'
import vector2farmer from '../../assets/Images/Vectors/vector2-farmers.png'
import vector3farmer from '../../assets/Images/Vectors/vector3-farmers.png'

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

interface TextIconButtonProps {
    text:string,
    color?: string,
    textColor?: string,
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

const TextIconButton : React.FC<TextIconButtonProps> = ({text, color="#3f7652", textColor="#fafafa", route}) => {
    return (
        <div style={{
            backgroundColor: color,
            padding: 8,
            display:'flex',
            justifyContent:'center',
            width:200,
            borderRadius: 30,
        }}
        className="main-home-texticonbutton"
        >
            <p 
                style={{color:textColor}}
            >
                {text}
            </p>
            <FontAwesomeIcon style={{color:textColor, alignSelf:'center', marginLeft: 10}} onClick={()=>{}}  icon={faLongArrowRight} />
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

            {/* ------------   Section 2 - CG2 -------------- */}
            <div className="main-home-cg2-container">
                <div className="main-home-cg2-box1">
                    <p className="cg2-t1">Welcome to Caribbean Goods</p>
                </div>
                <div className="main-home-cg2-box2">
                    <p className="cg2-t2">Finest Agricultural Imports</p>
                    <p className="cg2-t3">We supply speciality green coffee directly from ethical and sustainable farmers in Guatemala.</p>
                </div>
            </div>

            {/* ------------   Section 5 - CG5 -------------- */}
            <div className="main-home-cg5-container">
                <div className="cg5-container1">
                    <div >
                        <h1>Real Fair Coffee</h1>
                        <p style={{width:250}}>We source Specialty Green Coffee directly from ethical and sustainable farmers in Guatemala.</p>
                    </div>
                    <TextIconButton text="read more" />
                </div>
                <div className="cg5-container2">
                    <p>Marcelino</p>
                </div>
            </div>
            <div className="main-home-cg5-container2">
                <div>
                    <img src={vector1farmer} alt="" />
                    <p>We supply green coffee to roasters throughout the UK </p>
                    <TextIconButton text="Read more"/>
                </div>
                <div>
                    <img src={vector2farmer} alt="" />
                    <p>Our coffee really is ethical</p>
                    <TextIconButton text="Find out how"/>
                </div>
                <div>
                    <img src={vector3farmer} alt="" />
                    <p>Get in touch for more information</p>
                    <TextIconButton text="Say hello"/>
                </div>
            </div>
        </div>
    )
}


export default Home

