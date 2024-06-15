import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLongArrowRight } from '@fortawesome/free-solid-svg-icons';
import { To, useNavigate } from 'react-router-dom';

interface TextWButtonProps {
    text:string,
    order?:number,
    route?:string,
}

interface TextIconButtonProps {
    text:string,
    color?: string,
    textColor?: string,
    route?:To,
    blank?:string,
}

interface IconButtonProps {
    color?: string,
    route?:To,
}



const TextWButton : React.FC<TextWButtonProps> = ({text, order = 0, route='/'}) => {
    const navigate = useNavigate();
    return (
        <div className='main-home-text-w-button-1 cursor-pointer' onClick={()=>{navigate(route)}} style={{order:order}}>
            <p className="text-sm lg:text-base">{text}</p>
            <div className='main-home-icon-container '>
                <FontAwesomeIcon  className='main-home-icon w-10 hover:bg-[#3f7652]' icon={faLongArrowRight} />
            </div>
        </div>
    )
}

const TextIconButton : React.FC<TextIconButtonProps> = ({text, color="#3f7652", textColor="#fafafa", route='/', blank}) => {
    const navigate = useNavigate();
    return (
        <div style={{
            backgroundColor: color,
            padding: 15,
            display:'flex',
            justifyContent:'center',
            width:250,
            borderRadius: 30,
            letterSpacing:4,
        }}
        className="main-home-texticonbutton cursor-pointer"
        onClick={()=>{
            if (blank) {
                window.open(blank, '_blank');
            } 
            else {
                navigate(route)
            }
        }}
        >
            <p 
                style={{color:textColor, fontSize:12}}
            >
                {text}
            </p>
            <FontAwesomeIcon style={{color:textColor, alignSelf:'center', marginLeft: 10}} onClick={()=>{navigate(route)}}  icon={faLongArrowRight} />
        </div>
    )
}

const IconButton : React.FC<IconButtonProps> = ({color='#cce8e1', route='/'}) => {
    const navigate = useNavigate();
    return (
            <div className='flex items-center cursor-pointer' onClick={()=>{navigate(route)}}>
                <FontAwesomeIcon  className={`bg-[${color}] rounded-full px-6 py-[2px] w-10 hover:bg-[#3f7652] hover:text-[#FAFAFA]`} icon={faLongArrowRight} />
            </div>
    )
}

export { TextWButton, TextIconButton, IconButton };