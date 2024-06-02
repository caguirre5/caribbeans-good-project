import './RoastersBusinesses.css';

import vector1farmer from '../assets/Images/Vectors/vector1-farmers.png'

// import roaster1 from '../assets/Images/Vectors/Logo/roasters-brew.jpg'
import roaster2 from '../assets/Images/Vectors/Logo/roasters-podra.png'
import roaster3 from '../assets/Images/Vectors/Logo/roasters-fower.png'
import roaster4 from '../assets/Images/Vectors/Logo/roasters-thomsons.png'
import roaster5 from '../assets/Images/Vectors/Logo/roasters-inverness.png'
import { TextIconButton } from './Buttons';

function Roasters() {


    return (
        <div className="roastersb-container">
            
            <img src={vector1farmer} style={{width:120, height:120}} alt="" />
            <div className='roastersb-text'>
                <h2>We work with 30+ Roasters!</h2>
                <p>Some of the awesome businesses we work with</p>
            </div>
            <div className='roastersb-logos'>
                {/* <img src={roaster1} alt="" /> */}
                <img src={roaster2} alt="" />
                <img src={roaster3} alt="" />
                <img src={roaster4} alt="" />
                <img src={roaster5} alt="" />
            </div>
            <TextIconButton text='Join the journey' color='#9ed1c4' route='/Roasters'/>
        </div>
    );
}

export default Roasters;
