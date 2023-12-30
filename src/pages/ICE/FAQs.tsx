import './FAQs.css'
import { useNavigate } from 'react-router-dom';

function TAQs() {
    const navigate = useNavigate();

    const redirectToCoffeeProcess = (route : string) => {
        navigate(route); 
    };


    return (
        <div className='FAQ-page-container'>
            <div className='header-section'>
                <h3>FAQs</h3>
                <p>We want to make sure your experience with your VR headset is a smooth ride, in case you have any issues check out these FAQs to see if we have your question covered! if not send us a message on our chat and we will get back to you.</p>
            </div>
            <div className='questions-section'></div>
        </div>
    )
}

export default TAQs