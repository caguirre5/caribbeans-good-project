import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLongArrowRight } from '@fortawesome/free-solid-svg-icons';

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

const TextWButton : React.FC<TextWButtonProps> = ({text, order = 0, route}) => {
    return (
        <div className='main-home-text-w-button-1' style={{order:order}}>
            <p>{text}</p>
            <div className='main-home-icon-container'>
                <FontAwesomeIcon onClick={()=>{console.log(route)}} className='main-home-icon' icon={faLongArrowRight} />
            </div>
        </div>
    )
}

const TextIconButton : React.FC<TextIconButtonProps> = ({text, color="#3f7652", textColor="#fafafa", route}) => {
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
        className="main-home-texticonbutton"
        >
            <p 
                style={{color:textColor, fontSize:12}}
            >
                {text}
            </p>
            <FontAwesomeIcon style={{color:textColor, alignSelf:'center', marginLeft: 10}} onClick={()=>{console.log(route)}}  icon={faLongArrowRight} />
        </div>
    )
}

export { TextWButton, TextIconButton };