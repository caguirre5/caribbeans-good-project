import './RoastersBusinesses.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLongArrowRight } from '@fortawesome/free-solid-svg-icons';

import vector1farmer from '../assets/Images/Vectors/vector1-farmers.png'

import roaster1 from '../assets/Images/Vectors/Logo/roasters-brew.jpg'
import roaster2 from '../assets/Images/Vectors/Logo/roasters-podra.png'
import roaster3 from '../assets/Images/Vectors/Logo/roasters-fower.png'
import roaster4 from '../assets/Images/Vectors/Logo/roasters-thomsons.png'
import roaster5 from '../assets/Images/Vectors/Logo/roasters-inverness.jpg'

interface TextIconButtonProps {
    text:string,
    color?: string,
    textColor?: string,
    route?:string,
}

const TextIconButton : React.FC<TextIconButtonProps> = ({text, color="#3f7652", textColor="#fafafa", route}) => {
    return (
        <div style={{
            backgroundColor: color,
            padding: 15,
            display:'flex',
            justifyContent:'center',
            width:320,
            borderRadius: 30,
            letterSpacing:4,
        }}
        className="main-home-texticonbutton"
        >
            <p 
                style={{color:textColor, 
                    fontSize:14,}}
            >
                {text}
            </p>
            <FontAwesomeIcon style={{color:textColor, alignSelf:'center', marginLeft: 10}} onClick={()=>{console.log(route)}}  icon={faLongArrowRight} />
        </div>
    )
}

function Roasters() {


    return (
        <div className="roastersb-container">
            
            <img src={vector1farmer} style={{width:120, height:120}} alt="" />
            <div className='roastersb-text'>
                <h2>We work with 30+ Roasters!</h2>
                <p>Some of the awesome businesses we work with</p>
            </div>
            <div className='roastersb-logos'>
                <img src={roaster1} alt="" />
                <img src={roaster2} alt="" />
                <img src={roaster3} alt="" />
                <img src={roaster4} alt="" />
                <img src={roaster5} alt="" />
            </div>
            <TextIconButton text='Join the journey' color='#9ed1c4'/>
        </div>
    );
}

export default Roasters;
